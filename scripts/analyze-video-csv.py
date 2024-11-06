import argparse
import json
import sys

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
    'filename',
    help='image or video to predict upon'
  )
  parser.add_argument('--conf', default=0.8, type=float)
  parser.add_argument('--iou', default=0.5, type=float)
  parser.add_argument('--imgsz', default=736, type=int)
  parser.add_argument('-v', '--verbose', default=False, action='store_true')
  parser.add_argument('--show', default=False, action='store_true')
  parser.add_argument('--vid_stride', default=1, type=int)

  return parser.parse_args()

if __name__ == '__main__':
  argv = get_argv()

  from ultralytics import YOLO
  yoloModel = YOLO(argv.model)

  with open(argv.output, 'wt') as file:
    frame_counter = 0
    file.write(f'frame;class;confidence;x;y;w;h\n')

    for result in yoloModel.predict(
      source=argv.filename,
      conf=argv.conf,
      iou=argv.iou,
      imgsz=argv.imgsz,
      stream=True,
      verbose=argv.verbose,
      show=argv.show,
      vid_stride=argv.vid_stride
    ):
      for box in result.boxes:
        name = result.names[int(box.cls[0])]
        confidence = float(box.conf[0])
        x, y, w, h = [ float(i) for i in box.xywhn[0] ]
        x = x - w/2.0
        y = y - h/2.0

        file.write(f'{frame_counter * argv.vid_stride};{name};{confidence};{x};{y};{w};{h}\n')

      frame_counter += argv.vid_stride

    file.write(f'{frame_counter * argv.vid_stride};end\n')
    file.flush()
