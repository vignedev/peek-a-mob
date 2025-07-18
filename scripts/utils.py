import cv2 as cv
import numpy as np
import os
import json
from typing import Literal
from collections import namedtuple

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

def get_modifiers_from_filename(name: str):
  """
  name: <filename>.<modifier>.<modifier>
  name is without extension
  """
  # default values
  is_single = False
  morph_close_ksize = 32
  erode_ksize = 4
  dilate_ksize = 8

  modifiers = name.split('.')
  for mod in modifiers:
    if len(mod) == 0: continue
    modtype = mod[0]

    if modtype == 's':
      is_single = True
    elif modtype == 'm':
      morph_close_ksize = int(mod[1:])
    elif modtype == 'e':
      erode_ksize = int(mod[1:])
    elif modtype == 'd':
      dilate_ksize = int(mod[1:])
  
  return namedtuple('Modifier', ['is_single', 'morph_close_ksize', 'erode_ksize', 'dilate_ksize'])(is_single, morph_close_ksize, erode_ksize, dilate_ksize)

def annotate_file(src_image: str, format: Literal['bbox', 'center'], debug_draw: bool = False, area_threshold = 0.0) -> tuple[cv.typing.MatLike, list[tuple[int, float, float, float, float]]]:
  '''
  Returns the cropped top-left quadrant and a list of entities represented as tuples in the following format:

  `(entity_id, pos_x, pos_y, width, height)`

  `pos_x` and `pos_y` change based on what the `format` is.
  '''
  image = cv.imread(src_image, flags=cv.IMREAD_COLOR)
  height, width, channels = image.shape

  if (width % 2 != 0) or (height % 2 != 0):
    print(f'\nWARNING: One of the image\'s dimension ({width}x{height}) is not divisible by two!\n\t{src_image}')

  offset_x = width % 2
  offset_y = height % 2

  rgb       = image[                   0:height//2 ,                   0:width//2] # TL
  bitplane1 = image[                   0:height//2 , width//2 + offset_x:width   ] # TR
  bitplane2 = image[height//2 + offset_y:height    ,                   0:width//2] # BL (haha)
  bitplane3 = image[height//2 + offset_y:height    , width//2 + offset_x:width   ] # BR

  b_height, b_width, b_channels = bitplane1.shape

  entities = np.zeros((b_height, b_width), np.uint16)
  entities += np.sign(bitplane1[:, :, 2], dtype=np.uint16) * (1 << 8)
  entities += np.sign(bitplane1[:, :, 1], dtype=np.uint16) * (1 << 7)
  entities += np.sign(bitplane1[:, :, 0], dtype=np.uint16) * (1 << 6)
  entities += np.sign(bitplane2[:, :, 2], dtype=np.uint16) * (1 << 5)
  entities += np.sign(bitplane2[:, :, 1], dtype=np.uint16) * (1 << 4)
  entities += np.sign(bitplane2[:, :, 0], dtype=np.uint16) * (1 << 3)
  entities += np.sign(bitplane3[:, :, 2], dtype=np.uint16) * (1 << 2)
  entities += np.sign(bitplane3[:, :, 1], dtype=np.uint16) * (1 << 1)
  entities += np.sign(bitplane3[:, :, 0], dtype=np.uint16) * (1 << 0)

  unique_entities = np.unique(entities)
  entities_bucket = list()

  modifier = get_modifiers_from_filename('.'.join(os.path.basename(src_image).split('.')[:-1]))

  for id in unique_entities:
    if id == 0: continue
    mask = np.where(entities == id, np.uint8(255), np.uint8(0))

    kernel_m = cv.getStructuringElement(cv.MORPH_RECT, (modifier.morph_close_ksize, modifier.morph_close_ksize))
    kernel_e = cv.getStructuringElement(cv.MORPH_RECT, (modifier.erode_ksize, modifier.erode_ksize))
    kernel_d = cv.getStructuringElement(cv.MORPH_RECT, (modifier.dilate_ksize, modifier.dilate_ksize))
    mask = cv.morphologyEx(mask, cv.MORPH_CLOSE, kernel_m)
    mask = cv.erode(mask, kernel_e)
    mask = cv.dilate(mask, kernel_d)

    contours, _ = cv.findContours(mask, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)

    if modifier.is_single:
      contours = [np.vstack(contours)]

    for cnt in contours:
      x, y, w, h = cv.boundingRect(cnt)
      area = cv.contourArea(cnt) / ( b_width * b_height )

      # TODO: check if this is useful
      big_enough = area > area_threshold
      
      if debug_draw:
        color = (0, 255, 0) if big_enough else (0, 0, 255)
        cv.rectangle(rgb, (x,y), (x+w, y+h), color, 1)
        cv.putText(
          rgb,
          f'id={id} area={area}', (x, y - 4),
          fontFace=cv.FONT_HERSHEY_SIMPLEX,
          fontScale=0.4,
          color=color,
          thickness=1,
          lineType=cv.LINE_AA
        )
      
      if not big_enough:
        continue
    
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
          w / b_width, h / b_height
        ))
      else:
        raise SyntaxError(f'Unknown output format "{format}"')

  # if debug_draw:
  #   cv.imshow('rgb', rgb)
  #   while True:
  #     key = cv.waitKey(1) & 0xFF
  #     if key == ord('q'):
  #       break
  #   cv.destroyAllWindows()
  
  return rgb, entities_bucket

def annotate_layer_file(tifFile: str, format: Literal['bbox', 'center'], debug_draw: bool = False, area_threshold = 0.0) -> tuple[cv.typing.MatLike, list[tuple[int, float, float, float, float]]]:
  ret, images = cv.imreadmulti(tifFile)
  entities_bucket = []

  if not ret:
    raise Exception('Could not open the file')

  id = None
  for segment in tifFile.split('.'):
    if len(segment) == 0:
      continue
    header = segment[0]
    if header != 'i':
      continue

    id = int(segment[1:])
    break

  if id is None:
    raise Exception(f'No ID found in the filename')

  layerCount = len(images)
  if layerCount <= 1:
    raise Exception(f'Not enough layers!')
  
  background = images[0]
  b_width = background.shape[1]
  b_height = background.shape[0]

  for idx in range(1, layerCount):
    contours, _ = cv.findContours(np.sign(images[idx][:,:,0] + images[idx][:,:,1] + images[idx][:,:,2]), cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)
    for cnt in contours:
      x, y, w, h = cv.boundingRect(cnt)

      if debug_draw:
        color = (0, 255, 0)
        cv.rectangle(background, (x,y), (x+w, y+h), color, 1)
        cv.putText(
          background,
          f'id={id}', (x, y - 4),
          fontFace=cv.FONT_HERSHEY_SIMPLEX,
          fontScale=0.4,
          color=color,
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
          w / b_width, h / b_height
        ))

  return background, entities_bucket