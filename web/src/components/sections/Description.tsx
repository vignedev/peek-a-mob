import { Section } from '../Section'
import { Heading } from '../Heading'

export const DescriptionSection = () => {
  return <Section>
    <Heading size='2'>what is this?</Heading>
    <section>
      <p>
        For a school project, we finetuned a YOLOv11 model to detect Minecraft mobs from videos and such, and created this web ui to render bounding boxes on top of YouTube videos.
      </p>

      <p>
        You can click around on the timeline shown above to go to a specific portion of a video, with the occurences of the entities highlighted as a heat map.
      </p>
    </section>

    <Heading size='2'>dataset creation</Heading>
    <section>
      <p>
        The dataset used to finetune the model were made out of screenshots from the game itself, however with a specialized shader that allows us to identify individual entities. To load the shaders, a mod called Iris was used. An example of such screenshot is shown below.
      </p>

      <div className='my-4 flex flex-col items-center text-sm'>
        <img src='./assets/images/shader.png' loading='lazy' className='w-full max-w-2xl' />
        <i>Example of the segmentation shader in use</i>
      </div>

      <p>
        The shader splits the game into four quadrants, in which the top-left quandrant renders the original game, while the rest is used for <i>entity bitplanes</i>. Given that we have 3 bitplanes, each having 3 channels, then we are able to differentiate up to 511 entities. However, given that this was a school project, we limited the dataset capturing to certain entities only.
      </p>

      <p>
        After that, we just went around different Minecraft worlds to capture entities under different conditions, which later on resulted into a 10 GB repository full of screenshots. (<i>sorry to the school's ICT department for having to store all of it</i>).
        The dataset was then organized into folders, which were later used to generate the dataset. This was done so each of the entity has a proportionate number of data for training and validation of YOLO finetuning.
      </p>

      <p>
        During the generation, our script separates the quadrants and combines the bitplanes, which is then used to find their bounding boxes.
      </p>

      <p>
        Additionally, since a decent amount of Minecraft YouTube videos use some sort of shaderpacks to enhance the visuals that differ greatly from the regular game, we had also modified the Complementary Shaders to add the segmentation feature, as shown below. Without it, a lot of videos would fail at detecting the entities due to the differing lighting conditions.
      </p>

      <div className='my-4 flex flex-col items-center text-sm'>
        <img src='./assets/images/shader-chicken.png' loading='lazy' className='w-full max-w-2xl' />
        <i>The segmentation shader in action, however applied in Complementary Shader</i>
      </div>

      <p>
        In the end, the final model was finetuned using YOLOv11-M with 11467 screenshots with 9 entities. Given the sheer size of the dataset, as well as it containing screenshots of worlds and works of other people, we are currently unable to share it, as well as the final finetuned model itself.
      </p>
    </section>

    <Heading size='2'>how is it being displayed?</Heading>
    <section>
      <p>
        The videos provided above have been locally pre-processed, and are provided essentially as a sequence of entity occurences. In order to save bandwidth, it is binary packed with the structure shown below. All data types are in little-endian.
      </p>

      <div className='my-4 flex flex-col items-center'>
        <table className='border'>
          <thead>
            <tr>
              <th>Offset</th>
              <th>Field</th>
              <th>Datatype</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>0</td>
              <td><code>classIdx</code></td>
              <td><code>uint16</code></td>
            </tr>

            <tr>
              <td>2</td>
              <td><code>time</code></td>
              <td><code>float</code></td>
            </tr>

            <tr>
              <td>6</td>
              <td><code>confidence</code></td>
              <td><code>float</code></td>
            </tr>
            <tr>
              <td>10</td>
              <td><code>x</code></td>
              <td><code>float</code></td>
            </tr>
            <tr>
              <td>14</td>
              <td><code>y</code></td>
              <td><code>float</code></td>
            </tr>
            <tr>
              <td>18</td>
              <td><code>w</code></td>
              <td><code>float</code></td>
            </tr>
            <tr>
              <td>22</td>
              <td><code>h</code></td>
              <td><code>float</code></td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        This is then used to render both the timeline and its heatmaps per-entity, as well as overlaying bounding box on top of the video in based on the current time. The <code>time</code> is provided in seconds. Coordinates and dimensions of the bounding box (<code>x, y, w, h</code>) are in range from 0.0 to 1.0, with the <code>x, y</code> coordinates referring to the <i>top-left corner of the bounding box</i>.
      </p>
    </section>
  </Section>
}