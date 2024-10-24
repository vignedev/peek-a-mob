import cv2 as cv
import numpy as np
import os
import json
from typing import Literal

def get_entity_bidict(src_json: str):
  '''
  You can access ID using `entities_bidict['zombie']`
  or get the name using ID using `entities_bidict[3]`.
  '''
  entities_bidict = dict()
  with open(src_json) as file:
    temp_json = json.load(file)
    for entity in temp_json:
      entities_bidict[entity] = temp_json[entity]
      entities_bidict[temp_json[entity]] = entity
  return entities_bidict, temp_json

def annotate_file(src_image: str, format: Literal['bbox', 'center'], debug_draw: bool = False) -> tuple[cv.typing.MatLike, list[tuple[int, float, float, float, float]]]:
  '''
  Returns the cropped top-left quadrant and a list of entities represented as tuples in the following format:

  `(entity_id, pos_x, pos_y, width, height)`

  `pos_x` and `pos_y` change based on what the `format` is.
  '''
  image = cv.imread(src_image, flags=cv.IMREAD_COLOR)
  height, width, channels = image.shape

  rgb       = image[        0:height//2 ,        0:width//2] # TL
  bitplane1 = image[        0:height//2 , width//2:width   ] # TR
  bitplane2 = image[height//2:height    ,        0:width//2] # BL (haha)
  bitplane3 = image[height//2:height    , width//2:width   ] # BR

  b_height, b_width, b_channels = bitplane1.shape

  entities = np.zeros((b_height, b_width), np.uint16)
  entities += np.sign(bitplane1[:, :, 2]) * (1 << 8)
  entities += np.sign(bitplane1[:, :, 1]) * (1 << 7)
  entities += np.sign(bitplane1[:, :, 0]) * (1 << 6)
  entities += np.sign(bitplane2[:, :, 2]) * (1 << 5)
  entities += np.sign(bitplane2[:, :, 1]) * (1 << 4)
  entities += np.sign(bitplane2[:, :, 0]) * (1 << 3)
  entities += np.sign(bitplane3[:, :, 2]) * (1 << 2)
  entities += np.sign(bitplane3[:, :, 1]) * (1 << 1)
  entities += np.sign(bitplane3[:, :, 0]) * (1 << 0)

  unique_entities = np.unique(entities)
  entities_bucket = list()

  for id in unique_entities:
    if id == 0: continue
    mask = np.where(entities == id, np.uint8(255), np.uint8(0))

    # TODO: add hole-filing etc.

    contours, _ = cv.findContours(mask, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)
    for cnt in contours:
      x, y, w, h = cv.boundingRect(cnt)
      
      if debug_draw:
        cv.rectangle(rgb, (x,y), (x+w, y+h), (0, 255, 0), 1)
        cv.putText(
          rgb,
          f'id={id}', (x, y - 4),
          fontFace=cv.FONT_HERSHEY_SIMPLEX,
          fontScale=0.4,
          color=(0, 255, 0),
          thickness=1,
          lineType=cv.LINE_AA
        )
    
    if format == 'bbox':
      entities_bucket.append((
        id,
        x / b_width, y / b_height,
        w / b_width, y / b_height
      ))
    elif format == 'center':
      entities_bucket.append((
        id,
        (x + w/2) / b_width, (y + h/2) / b_height,
        w / b_width, y / b_height
      ))
    else:
      raise SyntaxError(f'Unknown output format "{format}"')

  if debug_draw:
    cv.imshow('rgb', rgb)
    while True:
      key = cv.waitKey(1) & 0xFF
      if key == ord('q'):
        break
    cv.destroyAllWindows()
  
  return rgb, entities_bucket
