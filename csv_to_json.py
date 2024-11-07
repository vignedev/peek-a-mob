import json
import csv
import sys

seconds = 10686
frames = 641160
# frames = seconds * 60
with open(sys.argv[-1], 'rt') as file:
  buckets = []
  for row in csv.DictReader(file, delimiter=';'):
    for key in ['time', 'x', 'y', 'w', 'h', 'confidence']:
      if key in row and row[key] is not None:
        row[key] = float(row[key])
    # row['time'] += 1
    buckets.append(row)

  print(json.dumps(buckets))
