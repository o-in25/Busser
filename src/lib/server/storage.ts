import { Storage } from '@google-cloud/storage';
import { GOOGLE_SERVICE_KEY, BUCKET} from '$env/static/private';
import moment from 'moment';

const base64Encode = (str: string) => Buffer.from(str).toString('base64');
const base64Decode = (str: string) => Buffer.from(GOOGLE_SERVICE_KEY, 'base64').toString(); 

const { client_email, private_key } = JSON.parse(base64Decode(GOOGLE_SERVICE_KEY));

const storage = new Storage({
  credentials: {
    client_email,
    private_key
  }
});

const bucket = storage.bucket(BUCKET);


// export const getBucket = async (name: string) => {
//   try {
//     const [files] = await storage.bucket('').getFiles();

//     console.log('Files:');
//     files.forEach(file => {
//       console.log(file.name);
//     });
//   } catch(e) {
//     console.log(e)
//   }
// }

export async function getSignedUrl(file: File): Promise<string> {
  try {
    const name = `${file.name}-${moment().format('MMDDYYYYSS')}`
    const newFile = bucket.file(name)
    const blob = await file.arrayBuffer();
    const data = Buffer.from(blob);
    await newFile.save(data, {
      contentType: 'image.jpeg',
    });

    const publicUrl = newFile.publicUrl();
    // const metadata = await newFile.getMetadata();
    return publicUrl;
  } catch(error) {
    console.error(error);
    return '';
  }
}
