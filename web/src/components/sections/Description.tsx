import { Section } from '../Section'
import { Heading } from '../Heading'

export const DescriptionSection = () => {
  return <Section>
    <Heading size='2'>what is this</Heading>
    <section>
      <p>
        we finetuned a yolov11 model to detect minecraft mobs from videos and such, and created this web ui to render bounding boxes on top of youtube videos
      </p>
    </section>

    <Heading size='2'>dataset creation</Heading>
    <section>
      <p>
        we were time constrained students, so we needed a relatively efficient way to gather dataset, and so we created a specialized "segmentation" shader that allows extraction of mob types from a screenshot
      </p>

      <p>
        sorry to the faculty for storing 10gb of minecraft screenshots in the repository. tehe
      </p>
    </section>

    <Heading size='2'>what is stored</Heading>
    <section>
      <p>
        on our side, nothing apart from the analyzed bounding boxes in time are stored, in a big csv file. the videos you are watching below are embedded from youtube, with the bounding boxes being overlaid on top of it
      </p>
      <p>
        during analysis, the videos are also being streamed and not stored locally. this allows me to save a couple of bucks avoiding storage, especially in the big ol' 26
      </p>
    </section>

    <Heading size='2'>minimal frontend?</Heading>
    <section>
      <p>original frontend featured more features, such as enqueuing new videos to be analyzed by our model and monitoring its progress. it also received the bounding box informations on the fly, instead of getting them all upon load.</p>

      <p>this is the "minimal" version, as in it works without any additional backend, lacks the request options etc. on the flip side though, it has optimizations and improvements that i learned while making the original version</p>
    </section>
  </Section>
}