import argparse
import json
import sys
import datetime
import math
import time

def get_argv():
  parser = argparse.ArgumentParser()
  parser.add_argument(
    '-m', '--model',
    help='path to the weights',
    required=True
  )
  parser.add_argument(
    '-o', '--output',
    required=True
  )
  parser.add_argument(
    'url',
    help='youtube url'
  )
  parser.add_argument('--conf', default=0.8, type=float)
  parser.add_argument('--iou', default=0.5, type=float)
  parser.add_argument('--imgsz', default=736, type=int)
  parser.add_argument('-v', '--verbose', default=False, action='store_true')
  parser.add_argument('--show', default=False, action='store_true')
  parser.add_argument('-j', '--json', default=False, action='store_true')

  return parser.parse_args()

if __name__ == '__main__':
  argv = get_argv()
  video = None

  from yt_dlp import YoutubeDL
  with YoutubeDL({ 'quiet': 'please', 'format': 'bestvideo[height<=1080][ext=mp4][vcodec^=avc]' }) as ytdl:
    info = ytdl.extract_info(argv.url, download=False)
    if info is None:
      print(f'> YouTube didn\'t return a video result, sad tako...', file=sys.stderr)
      exit(1)

    video = {}
    for key in ['title', 'id', 'width', 'height', 'fps', 'channel', 'duration', 'uploader_id', 'channel_id']:
      video[key] = info[key]

    # TODO: naive and stupid way -- yt_dlp usually selects bestvideo+bestaudio (usually highest)
    #       so we take the *first id*, which should be the video ID (could easily fail though)
    fmt = {
      'format': info['format'],
      'format_note': info['format'],
      'format_id': info['format_id'],
      'url': info['url']
    }

    print(f'> Analyzing "{video['title']}" ({video['id']}, {video['width']}x{video['height']} @ {video['fps']}) from "{video['channel']}", long {video['duration']} seconds', file=sys.stderr)
    print(f'> Using format_id={fmt['format_id']} aka {fmt['format_note']}', file=sys.stderr)
    video['format'] = fmt

  if video is None:
    print('Received no video... the hell?', file=sys.stderr)
    exit(1)

  import cv2
  from ultralytics import YOLO
  yoloModel = YOLO(argv.model)

  cap = cv2.VideoCapture(video['format']['url'])
  vWidth = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
  vHeight = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
  vFrames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
  vFPS = int(cap.get(cv2.CAP_PROP_FPS))

  vFramesStr = datetime.timedelta(seconds=vFrames/vFPS)

  with open(argv.output, 'wt') as file:
    frame_pos = int(cap.get(cv2.CAP_PROP_POS_FRAMES)) # should be 0, but just to be sure
    found_total = 0
    avg_rate = 0
    last_time = time.time()

    metadata = {
      "video": {
        'title': video['title'],
        'id': video['id'],
        'width': video['width'],
        'height': video['height'],
        'fps': video['fps'],
        'channel': video['channel'],
        'duration': video['duration'],
        'format': video['format']['format'],
        'uploader_id': video['uploader_id'],
        'channel_id': video['channel_id']
      },
      "argv": vars(argv)
    }
    file.write(f"#$ {json.dumps(metadata)}\n")
    file.write(f'time;class;confidence;x;y;w;h\n')
    while cap.isOpened():
      ret, frame = cap.read()

      if ret is False:
        sys.stderr.writable('> ??? we got no frame? literally no cap')
        break

      for result in yoloModel.predict(
        source=frame,
        conf=argv.conf,
        iou=argv.iou,
        imgsz=argv.imgsz,
        stream=True,
        verbose=argv.verbose,
        show=argv.show,
      ):
        if result.boxes is None:
          sys.stderr.write(f'> ??? result.boxes is None?\n', file=sys.stderr)
          continue

        for box in result.boxes:
          name = result.names[int(box.cls[0])]
          confidence = float(box.conf[0])
          x, y, w, h = [ float(i) for i in box.xywhn[0] ]
          x = x - w/2.0
          y = y - h/2.0
          file.write(f'{(frame_pos / vFrames) * video['duration']};{name};{confidence};{x};{y};{w};{h}\n')
          found_total += 1

      now_time = time.time()
      time_diff = now_time - last_time
      last_time = now_time
      avg_rate = avg_rate + (time_diff - avg_rate) / (frame_pos+1)
      if frame_pos % vFPS == 0:
        if argv.json:
          sys.stdout.write(json.dumps({
            'currentFrame': frame_pos,
            'totalFrames': vFrames,
            'rate': {
              'average': avg_rate,
              'last': time_diff
            }
          }) + '\n')
          sys.stdout.flush()
        else:
          sys.stderr.write(f'\r{(frame_pos/vFrames*100.0):.2f}% | {datetime.timedelta(seconds=math.floor(frame_pos / vFPS))} - {vFramesStr} | {frame_pos}/{vFrames} | {found_total} | {(1.0 / time_diff):.2f} FPS ({time_diff:.1f} ms) | {(1.0 / avg_rate):.2f} aFPS ({avg_rate:.1f} ms) | ETA: {datetime.timedelta(seconds=math.floor((vFrames - frame_pos) * avg_rate))}         ')

      if frame_pos % (vFPS * 100) == 0:
        file.flush()

      frame_pos += 1
      if frame_pos == vFrames:
        if argv.json:
          sys.stdout.write(json.dumps({
            'currentFrame': frame_pos,
            'totalFrames': vFrames,
            'rate': {
              'average': avg_rate,
              'last': time_diff
            }
          }) + '\n')
          sys.stdout.flush()
        else:
          sys.stderr.write(f'\r{(frame_pos/vFrames*100.0):.2f}% | {datetime.timedelta(seconds=math.floor(frame_pos / vFPS))} - {vFramesStr} | {frame_pos}/{vFrames} | {found_total} | {(1.0 / time_diff):.2f} FPS ({time_diff:.1f} ms) | {(1.0 / avg_rate):.2f} aFPS ({avg_rate:.1f} ms) | ETA: {datetime.timedelta(seconds=math.floor((vFrames - frame_pos) * avg_rate))}         ')

        cap.release()
        break

    file.flush()
