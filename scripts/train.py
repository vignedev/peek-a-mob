from argparse import ArgumentParser
import datetime

def get_argv():
  parser = ArgumentParser()
  parser.add_argument('-m', '--model', help='pretrained model', required=True)
  parser.add_argument('-d', '--data', help='path to dataset data.yaml', required=True)

  parser.add_argument('-e', '--epochs', help='number of epochs', default=100, type=int)
  parser.add_argument('-s', '--imgsz', help='image size downscaling', default=640, type=int)
  parser.add_argument('-b', '--batch', help='(for gpu) memory budget percentage', default=0.7, type=float)
  parser.add_argument('-v', '--verbose', default=True, action='store_true')
  parser.add_argument('-n', '--name', help='name of the model, defaults to pam_YYYYmmdd_HHMMSS')

  return parser.parse_args()

if __name__ == '__main__':
  argv = get_argv()

  name = argv.name if argv.name is not None else datetime.datetime.now().strftime("pam_%Y%m%d_%H%M%S")
  print(f">> Generated name: {name}")

  from ultralytics import YOLO
  model = YOLO(argv.model)
  results = model.train(
    data=argv.data,
    epochs=argv.epochs,
    imgsz=argv.imgsz,
    batch=argv.batch,
    verbose=argv.verbose,

    # workers=16,
    deterministic=False,
    name=name,
    plots=True,
    save=True,
    degrees=30.0,
    # perspective=0.001,
    copy_paste=1.0,
    erasing=0.6,
    crop_fraction=0.85
  )