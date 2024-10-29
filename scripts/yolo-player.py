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
      cv2.setTrackbarPos('videoPos', 'player', positionFrames)
      initialFlag = True
    if isPlaying or isDirty:
      if int(capture.get(cv2.CAP_PROP_POS_FRAMES)) == vFrames:
        capture.set(cv2.CAP_PROP_POS_FRAMES, 0) # loop at end
      
      ret, frame = capture.read()
      if ret:
        results = yoloModel.predict(source=frame, verbose=False)
        cv2.imshow('player', results[0].plot())
      isDirty = False

    key = cv2.waitKey(1) & 0xFF
    if key == ord('q'):
      break
    elif key == ord(' '):
      positionFrames = int(capture.get(cv2.CAP_PROP_POS_FRAMES))
      cv2.setTrackbarPos('videoPos', 'player', positionFrames)
      isPlaying = not isPlaying
      isDirty = True
    elif key == 83:
      positionFrames = int(capture.get(cv2.CAP_PROP_POS_FRAMES)) + 300
      capture.set(cv2.CAP_PROP_POS_FRAMES, positionFrames)
      isDirty = True
    elif key == 81:
      positionFrames = int(capture.get(cv2.CAP_PROP_POS_FRAMES)) - 300
      capture.set(cv2.CAP_PROP_POS_FRAMES, positionFrames)
      isDirty = True
  capture.release()
  cv2.destroyAllWindows()