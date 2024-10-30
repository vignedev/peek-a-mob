import argparse
import time
from os import path
import os
import cv2
from ultralytics import YOLO
import numpy as np
import mss

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
  parser.add_argument('-w', '--webcam', action='store_true', default=False)
  parser.add_argument('--conf', default=0.8, type=float)
  parser.add_argument('--iou', default=0.5, type=float)
  parser.add_argument('--imgsz', default=640, type=int)
  parser.add_argument('-r', '--rate', default=60, help='framerate', type=float)
  parser.add_argument('-o', '--output', type=str, default=None, help='where to save frames where things were detected')
  return parser.parse_args()

def detect_and_label(frame, yoloModel: YOLO, save: str | None=None):
  saved_image = False
  for result in yoloModel.predict(
    source=frame,
    verbose=False,
    conf=argv.conf,
    iou=argv.iou,
    imgsz=argv.imgsz,
    stream=True
  ):
    if save is not None:
      if not saved_image and int(result.boxes.shape[0]) != 0:
        ctime = time.time()
        cv2.imwrite(path.join(save, f'monitor_{ctime}_raw.png'), frame)
        frame = result.plot()
        cv2.imwrite(path.join(save, f'monitor_{ctime}_annotated.png'), frame)
        saved_image = True
      else:
        frame = result.plot()
    else:
      frame = result.plot()

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
  return frame

if __name__ == '__main__':
  argv = get_argv()

  # init the model
  yoloModel = YOLO(argv.model)

  # create a cv2 dumb video player
  cv2.namedWindow('player', cv2.WINDOW_GUI_NORMAL)
  cv2.setNumThreads(16)

  s_interval = 1.0 / argv.rate

  if argv.webcam:
    capture = cv2.VideoCapture(argv.monitor)
    condition = capture.isOpened()
  else:
    capture = mss.mss()
    monitor = capture.monitors[argv.monitor]
    condition = True

  if argv.output:
    os.makedirs(argv.output, exist_ok=True)

  last_frame = time.time()
  while condition:
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

    if argv.webcam:
      ret, frame = capture.read()
    else:
      frame = np.asarray(capture.grab(monitor))[:,:,:3]

    cv2.imshow('player', detect_and_label(frame, yoloModel, save=argv.output))

  cv2.destroyAllWindows()