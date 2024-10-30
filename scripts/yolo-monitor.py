import argparse

def get_argv():
  parser = argparse.ArgumentParser()
  parser.add_argument(
    '-m', '--model',
    help='path to the weights',
    required=True
  )
  parser.add_argument(
    'monitor',
    help='index of the monitor',
    default=0,
    type=int
  )
  parser.add_argument(
    '-p', '--position',
    help='position to load into',
    type=int,
    default=0
  )
  parser.add_argument('--conf', default=0.8, type=float)
  parser.add_argument('--iou', default=0.5, type=float)
  parser.add_argument('--imgsz', default=640, type=int)
  parser.add_argument('-r', '--rate', default=60, help='framerate', type=float)
  return parser.parse_args()

if __name__ == '__main__':
  argv = get_argv()

  import cv2
  from ultralytics import YOLO
  import numpy as np
  import mss
  import time

  # init the model
  yoloModel = YOLO(argv.model)

  # create a cv2 dumb video player
  cv2.namedWindow('player', cv2.WINDOW_GUI_NORMAL)
  cv2.setNumThreads(16)

  capture = mss.mss()
  monitor = capture.monitors[argv.monitor]
  s_interval = 1.0 / argv.rate

  last_frame = time.time()
  while True:
    current_time = time.time()
    diff_this_frame = current_time - last_frame
    if argv.rate > 0 and (diff_this_frame > s_interval):
      last_frame = current_time
    else:
      time.sleep(s_interval - diff_this_frame)
      continue

    key = cv2.waitKey(1) & 0xFF
    if key == ord('q'):
      break

    frame = np.asarray(capture.grab(monitor))[:,:,:3]
    results = yoloModel.predict(
      source=frame,
      verbose=False,
      conf=argv.conf,
      iou=argv.iou,
      imgsz=argv.imgsz,
    )
    frame = results[0].plot()
    cv2.rectangle(
      frame,
      (0, 0),
      (175, 24),
      (0, 0, 0, 128),
      thickness=cv2.FILLED
    )
    cv2.putText(
      frame,
      f'{(1.0 / diff_this_frame):.1f} FPS ({(diff_this_frame*1000):.2f}ms)', (4, 16),
      fontFace=cv2.FONT_HERSHEY_SIMPLEX,
      fontScale=0.5,
      color=(0, 255, 0),
      thickness=1,
      lineType=cv2.LINE_AA
    )
    cv2.imshow('player', frame)

  cv2.destroyAllWindows()