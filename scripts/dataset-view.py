import os
from os import path
import sys
import yaml

from PyQt6 import QtCore, QtGui, QtWidgets, uic
from PyQt6.QtCore import Qt

def read_dataset(dataset_path: str):
  data_yaml = None
  with open(path.join(dataset_path, 'data.yaml')) as file:
    data_yaml = yaml.safe_load(file)

  bucket = []
  for (dirpath, dirnames, filenames) in os.walk(path.join(dataset_path)):
    for filename in filenames:
      if filename.endswith('.png') or filename.endswith('.jpeg') or filename.endswith('.jpg'):
        bucket.append(path.join(dirpath, filename))

  return data_yaml['names'], sorted(bucket)

class MainWindow(QtWidgets.QMainWindow):
  def __init__(self):
    super().__init__()

    if len(sys.argv) != 2: raise 'shinda'
    self.path = sys.argv[-1]

    self.data = read_dataset(self.path)

    self.layout = QtWidgets.QHBoxLayout()
    self.widget = QtWidgets.QWidget()
    self.widget.setLayout(self.layout)
    self.setCentralWidget(self.widget)

    self.list_widget = QtWidgets.QListWidget()
    for image in self.data[1]:
      item = QtWidgets.QListWidgetItem(
        '/'.join(image.split('/')[-3:]),
        parent=self.list_widget
      )
      item.data = image
      self.list_widget.addItem(item)
    self.list_widget.currentItemChanged.connect(self.change_canvas)
    self.layout.addWidget(self.list_widget)

    self.canvas = QtWidgets.QLabel()
    self.canvas_ctx = QtGui.QPixmap(800, 600)
    self.canvas.setPixmap(self.canvas_ctx)
    self.layout.addWidget(self.canvas)

  def change_canvas(self, i: QtWidgets.QListWidgetItem):
    image_path = i.data
    label_path = image_path.split('/')
    label_path[-2] = 'labels'
    label_path[-1] = '.'.join(label_path[-1].split('.')[:-1]) + '.txt'
    label_path = '/'.join(label_path)

    self.canvas_ctx = QtGui.QPixmap(image_path)
    painter = QtGui.QPainter(self.canvas_ctx)
    pen = QtGui.QPen(QtGui.QColor(0xFF0000), 3.0)
    pen2 = QtGui.QPen(QtGui.QColor(0x000000), 5.0)
    pen3 = QtGui.QPen(QtGui.QColor(0xFFFFFF), 1.0)
    brush = QtGui.QBrush(QtGui.QColor(128, 0, 0, 128))

    counter = 0
    with open(label_path, 'rt') as file:
      for line in file.readlines():
        id, cx, cy, w, h = [ float(f) for f in line.split() ]

        w = int(w * self.canvas_ctx.width())
        h = int(h * self.canvas_ctx.height())
        x = int((cx * self.canvas_ctx.width()) - w // 2)
        y = int((cy * self.canvas_ctx.height()) - h // 2)

        name = self.data[0][int(id)]
        painter.setPen(pen2)
        painter.drawRect(x, y, w, h)
        painter.setPen(pen)
        painter.drawRect(x, y, w, h)
        painter.setPen(pen3)
        painter.drawRect(x, y, w, h)

        painter.fillRect(x, y, w, h, brush)

        painter.setPen(pen)
        painter.setFont(QtGui.QFont("monospace", 8))
        painter.drawText(x + 2, y + 12, f'[{counter}] {name}')
        painter.drawText(16, 24 + 16 * counter, f'[{counter}] {name}')

        counter += 1
    painter.end()
    self.canvas.setPixmap(self.canvas_ctx)

app = QtWidgets.QApplication(sys.argv)
window = MainWindow()
window.show()
app.exec()
