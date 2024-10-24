import cv2
import numpy as np
import os

mask_directory = 'mask-data-set'
output_data_log = 'sample_data_set/test/labels' # je to zatím trochu stupidní, musíš spusit 3x script, pak udělám lepší verzi, teď běžím na vlak :DD
# pak musíš ručně hodit images do /images
lower_red = np.array([0, 100, 100])
upper_red = np.array([10, 255, 255])
lower_red2 = np.array([160, 100, 100])
upper_red2 = np.array([180, 255, 255])

for filename in os.listdir(mask_directory):
    mask_path = os.path.join(mask_directory, filename)
    log_path = os.path.join(output_data_log, filename[:-4] + ".txt")

    if filename.endswith('.png'):
        label_array = []
        mask_image = cv2.imread(mask_path)

        height, width, _ = mask_image.shape

        hsv_mask = cv2.cvtColor(mask_image, cv2.COLOR_BGR2HSV)

        mask1 = cv2.inRange(hsv_mask, lower_red, upper_red)
        mask2 = cv2.inRange(hsv_mask, lower_red2, upper_red2)
        red_mask = mask1 | mask2

        contours, _ = cv2.findContours(red_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            label_array.append(f"0 {(x+w/2)/width} {(y+h/2)/height} {w/width} {h/height}")
        
        with open(log_path, "w") as file:
            for label in label_array:
                file.write(label + "\n")

cv2.waitKey(0)
cv2.destroyAllWindows()
