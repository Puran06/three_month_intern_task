import axios from 'axios';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.ASSEMBLY_AI_KEY;

export default class AssemblyAIDocumentLoader {
  async transcribe(filePath) {
    console.log('⏫ Uploading audio to AssemblyAI...');
    const audio = fs.createReadStream(path.resolve(filePath));

    const uploadRes = await axios.post(
      'https://api.assemblyai.com/v2/upload',
      audio,
      {
        headers: {
          authorization: API_KEY,
          'Transfer-Encoding': 'chunked',
        },
      }
    );

    const audioUrl = uploadRes.data.upload_url;
    console.log('✅ Upload successful:', audioUrl);

    const transcriptRes = await axios.post(
      'https://api.assemblyai.com/v2/transcript',
      {
        audio_url: audioUrl,
        punctuate: true,
        format_text: true,
      },
      {
        headers: {
          authorization: API_KEY,
        },
      }
    );

    const transcriptId = transcriptRes.data.id;
    console.log('⏳ Transcription started...');

    let status = 'queued';
    let transcriptText = '';

    while (status !== 'completed') {
      const polling = await axios.get(
        `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
        {
          headers: {
            authorization: API_KEY,
          },
        }
      );

      status = polling.data.status;

      if (status === 'completed') {
        transcriptText = polling.data.text;
        break;
      }

      if (status === 'error') {
        throw new Error(`❌ Transcription failed: ${polling.data.error}`);
      }

      console.log('⌛ Waiting for transcription...');
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    console.log('✅ Transcription complete');
    return transcriptText;
  }
}
