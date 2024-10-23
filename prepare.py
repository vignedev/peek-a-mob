import cv2 as cv
import numpy as np

in_image = cv.imread('/home/vignette/School/VMM/VMM-Datapack/zombie-pack/zombie-during-day/2024-10-22_11.09.37.png', cv.IMREAD_COLOR)
height, width, channels = in_image.shape
albedo = cv.resize(in_image[0:height, 0:width//2]    , (width, height))
buffer = cv.resize(in_image[0:height, width//2:width], (width, height), interpolation=cv.INTER_NEAREST_EXACT)[:,:,2] #  B  G [R]
depth  = cv.resize(in_image[0:height, width//2:width], (width, height), interpolation=cv.INTER_NEAREST_EXACT)[:,:,0] # [B] G  R

# for hole filling
kernel = cv.getStructuringElement(cv.MORPH_RECT, (4, 4))
kernel2 = cv.getStructuringElement(cv.MORPH_RECT, (2, 2))

# dilate a bit
# buffer2 = cv.dilate(buffer, kernel)
buffer2 = cv.morphologyEx(buffer, cv.MORPH_CLOSE, kernel)
buffer2 = cv.erode(buffer, kernel)

#cv.namedWindow('rgb', cv.WINDOW_NORMAL)
#cv.imshow('rgb',  cv.putText(albedo , "rgb" , (25, 25), cv.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2, cv.LINE_AA))
# cv.namedWindow('buf', cv.WINDOW_NORMAL)
#cv.imshow('buf',  cv.putText(cv.cvtColor(buffer, cv.COLOR_GRAY2BGR) , "buf" , (25, 25), cv.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2, cv.LINE_AA))
# cv.namedWindow('buf2', cv.WINDOW_NORMAL)
#cv.imshow('buf2', cv.putText(cv.cvtColor(buffer2, cv.COLOR_GRAY2BGR), "buf2", (25, 25), cv.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2, cv.LINE_AA))
#cv.namedWindow('mul', cv.WINDOW_NORMAL)
#cv.imshow('mul',  cv.putText(
#  cv.cvtColor(buffer2, cv.COLOR_GRAY2BGR)
#  #cv.bitwise_and(albedo, albedo, mask=buffer2)
#  , "mul", (25, 25), cv.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2, cv.LINE_AA))

final = np.concatenate(
  (
    np.concatenate(
      (
        cv.putText(albedo , "rgb" , (25, 45), cv.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2, cv.LINE_AA),
        cv.putText(cv.cvtColor(buffer, cv.COLOR_GRAY2BGR), "buffer", (25, 45), cv.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2, cv.LINE_AA)
      ),
      axis=1
    ),
    np.concatenate(
      (
        cv.putText(cv.cvtColor(buffer2, cv.COLOR_GRAY2BGR), "buffer_mod" , (25, 45), cv.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2, cv.LINE_AA),
        cv.putText(cv.bitwise_and(albedo, albedo, mask=buffer2), "masked", (25, 45), cv.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2, cv.LINE_AA)
      ),
      axis=1
    )
  )
  , axis=0
)

cv.line(final, (width,  0), (width, height*2), (0, 255, 0), 4)
cv.line(final, (0, height), (width*2, height), (0, 255, 0), 4)

cv.namedWindow('final', cv.WINDOW_NORMAL)
cv.imshow('final', final)

while True:
  key = cv.waitKey(1) & 0xFF
  if key == ord('q'):
    break
cv.destroyAllWindows()