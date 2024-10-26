import argparse

def get_argv():
  parser = argparse.ArgumentParser()
  parser.add_argument(
    '-m', '--model',
    help='path to the weights',
    required=True
  )
  parser.add_argument(
    'filename',
    help='image or video to predict upon'
  )
  parser.add_argument(
    '-p', '--position',
    help='position to load into',
    type=int,
    default=0
  )
  return parser.parse_args()

if __name__ == '__main__':
  argv = get_argv()

  import cv2
  from ultralytics import YOLO

  # init the model
  yoloModel = YOLO(argv.model)

  # create a cv2 dumb video player
  cv2.namedWindow('player', cv2.WINDOW_NORMAL)
  capture = cv2.VideoCapture(argv.filename)
  vWidth = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
  vHeight = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
  vFrames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
  
  isPlaying = False
  isDirty = True
  initialFlag = argv.position == 0
  positionFrames = argv.position

  def change_time(position):
    global isDirty
    capture.set(cv2.CAP_PROP_POS_FRAMES, position)
    isDirty = True
  cv2.createTrackbar('videoPos', 'player', 0, vFrames, change_time)

  while capture.isOpened:
    if not initialFlag:
      capture.set(cv2.CAP_PROP_POS_FRAMES, argv.position)
      initialFlag = True
    if isPlaying or isDirty:
      if int(capture.get(cv2.CAP_PROP_POS_FRAMES)) == vFrames:
        capture.set(cv2.CAP_PROP_POS_FRAMES, 0) # loop at end
      
      ret, frame = capture.read()
      frame = cv2.resize(frame, (560, 315))
      if ret:
        positionFrames = int(capture.get(cv2.CAP_PROP_POS_FRAMES))
        results = yoloModel.predict(source=frame, verbose=False)
        
        for result in results:
          for box in result.boxes:
            confidence = float(box.conf[0])
            class_id = int(box.cls[0])
            x, y, w, h = [ int(i) for i in box.xywh[0] ]
            name = result.names[class_id]

            cv2.rectangle(
              frame,
              pt1=(x-w//2, y-h//2), pt2=(x+w//2, y+h//2),
              color=(0, 0, 255),
              thickness=2
            )
            cv2.putText(
              frame,
              f'{name}[{confidence:.2f}]',
              (x - w//2, y - h//2 - 4),
              fontFace=cv2.FONT_HERSHEY_SIMPLEX,
              fontScale=0.4,
              color=(0, 0, 255),
              thickness=1,
              lineType=cv2.LINE_AA
            )

        cv2.imshow('player', frame)
        cv2.setTrackbarPos('videoPos', 'player', positionFrames)
      isDirty = False

    key = cv2.waitKey(1) & 0xFF
    if key == ord('q'):
      break
    elif key == ord(' '):
      isPlaying = not isPlaying

  capture.release()
  cv2.destroyAllWindows()