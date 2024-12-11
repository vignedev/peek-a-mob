# `peek-a-mob`

## Backend

```sh
cd backend
npm install
cp .env.example .env
# vim .env -- edit the .env file approapriately
npm run drizzle-push
npm run dev 
```

Within the `.env` file, you have to specfify the connection to a PostgreSQL database ***and*** the `MODEL_ROOT_PATH` path, where the uploaded models would be stored. Oh, ***and also*** the `PROJECT_ROOT`, which should point to the cloned *repository*, where all the projects are. You can use a Docker image for that as such:

```sh
docker run --name vmm-db -e POSTGRES_USER=vignette -e POSTGRES_PASSWORD=wah --restart=unless-stopped -p 127.0.0.1:5432:5432 -d postgres:alpine
```

To add videos from the `scripts/analyze-youtube.csv`, use `npm run import_csv <csv file>`, like so:

```sh
npm run import_csv '../yt_uEvwuvod2F4_[pam_20241115_200607].csv'
```

## Frontend

```sh
cd frontend
npm install
npm run dev
```

The server proxies requests from `/api` to `http://127.0.0.1:8080`, the location where the backend is supposedly running, so ideally, both projects should be running at the same time. 

If it is running elsewhere, change the `PROXY_API` environmental variable in `.env`.

## Minecraft Shader

Follow the [instructions](./minecraft_shader).

## Dataset generation

You have to use the [`minecraft_shader/generate_entityprop.js`](`minecraft_shader/generate_entityprop.js`) file first to get `entities.json`. 

```sh
# example: generate the dataset
python3 scripts/dataset-gen.py \
  -i ../peek-a-mob-dataset/raw-dataset-v2 \
  -o ../peek-a-mob-dataset/dataset-v2 \
  -f center \
  -t random_sort \
  -e minecraft_shader/entities.json \
  -x jpg \
  -a 0
```

## Training

Either use `yolo` CLI tools, or the [`scripts/train.py`](scripts/train.py) which does the same but has some parameters set. The name is implicitly in the `pam_YYYYmmdd_HHMMSS` format. You can change the name if desired by using the `-n` parameter.

Replace `-m yolo11n.pt` with a different YOLO model, or an older iteration if further fine-tuning is desired.

```sh
# example: training on our dataset
python3 scripts/train.py \
  -m yolo11n.pt \
  -d '../peek-a-mob-dataset/dataset-v2/data.yaml'
```

## Using the model

### Live Preview

You can use [`scripts/yolo-monitor.py`](scripts/yolo-monitor.py), which will either use a screen capture or webcam to predict on. Quit by pressing `q`.

```sh
# screen capture | MONITOR_INDEX from 0 (usually all screens), to 1..inf (separate screens)
python3 scripts/yolo-monitor.py -m $PATH_TO_MODEL $MONITOR_INDEX

# webcam capture (for eg. using OBS Virtual Cameras)
python3 scripts/yolo-monitor.py -m $PATH_TO_MODEL --webcam $WEBCAM_INDEX
```

If `--output` folder is specified, *every frame that something is detected will be saved to that folder*. Careful, since this can fill your drive pretty quickly.

### Video Analysis

#### Offline Videos

You can use [`scripts/yolo-player.py`](scripts/yolo-player.py), which will either use a screen capture or webcam to predict on.

Quit by pressing `q`, pause the playback using `space`, and go few seconds backwards and forwards using the arrow keys, or using the seekbar.

```sh
# watching the video from start
python3 scripts/yolo-monitor.py -m $PATH_TO_MODEL video.mp4

# watching the video from a certain frame index (usually seconds * fps)
python3 scripts/yolo-monitor.py -m $PATH_TO_MODEL video.mp4 -p $FRAME_INDEX
```

#### YouTube Videos

Using [`scripts/analyze-youtube.py`](scripts/analyze-youtube.py) it will, instead of being "watchable" in real-time, will create a CSV file with the detections found in the video. 

This script is created for convenience, since it does not perform download-to-disk operation, and performs it in real-time. Note that you might be throttled due to the way the YouTube video is being downloaded.

```sh
# analyze the video and save it to that csv
python3 scripts/analyze-youtube.py \
  -m "$PATH_TO_MODEL" \
  -o 'yt_4Vs1wKjNuUw_pam20241104.csv' \
  --imgsz 640 \
  --conf 0.8 \
  'https://www.youtube.com/watch?v=4Vs1wKjNuUw'
```

The CSV is in the following format (values truncated and spaced out for visual clarity):
```csv
# comments wowie
#$ {}
time   ; class   ; confidence ; x          ; y          ; w          ; h
849.33 ; chicken ; 0.83124202 ; 0.40599769 ; 0.33868791 ; 0.06660496 ; 0.14599372
849.35 ; chicken ; 0.84522515 ; 0.40610400 ; 0.33875331 ; 0.06572787 ; 0.14552843
849.36 ; chicken ; 0.83764874 ; 0.40259035 ; 0.33476971 ; 0.06551768 ; 0.14790353
849.45 ; chicken ; 0.90651297 ; 0.40337522 ; 0.34616665 ; 0.07244345 ; 0.17948314
849.51 ; chicken ; 0.87128227 ; 0.40180826 ; 0.28459030 ; 0.08683519 ; 0.23283606
849.53 ; chicken ; 0.80196487 ; 0.40061134 ; 0.28357558 ; 0.08598130 ; 0.21841843
849.55 ; chicken ; 0.81872236 ; 0.39908255 ; 0.27393700 ; 0.09737453 ; 0.22778627
849.56 ; chicken ; 0.80176430 ; 0.39911331 ; 0.27407727 ; 0.09761925 ; 0.22764728
```

The `time` is in *seconds*. `x`, `y`, `w`, `h` are normalized values by the original video resolution, and `(x, y)` represents the *top-left* corner of the bounding box[^1].

Lines which begin with `#` are comments and should be ignored. All files have a `#$` file, where its contents is a JSON object representing the metadata of the video and analysis. The JSON has the following structure (prettified for visual clarity):

```json
{
  "video": {
    "title": "【Minecraft】 Together As One!!! #MythOneblock",
    "id": "uEvwuvod2F4",
    "width": 1920,
    "height": 1080,
    "fps": 60,
    "channel": "Ninomae Ina'nis Ch. hololive-EN",
    "duration": 8620,
    "format": "303 - 1920x1080 (1080p60)",
    "uploader_id": "@NinomaeInanis"
  },
  "argv": {
    "model": "runs/detect/pam_20241115_200607/weights/best.pt",
    "output": "yt_uEvwuvod2F4_[pam_20241115_200607].csv",
    "url": "https://www.youtube.com/watch?v=uEvwuvod2F4",
    "conf": 0.6,
    "iou": 0.5,
    "imgsz": 736,
    "verbose": false,
    "show": false
  }
}
```

## Code of Interest

[`./coi.md`](./coi.md)

[^1]: Unlike YOLO's dataset format, which specifies `(x, y)` as the center of the bounding box.