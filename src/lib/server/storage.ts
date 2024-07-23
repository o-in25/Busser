import { Storage } from '@google-cloud/storage';
import { GOOGLE_SERVICE_KEY, BUCKET} from '$env/static/private';

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

export async function uploadFile(file: File, fileName: string) {
  try {
    const newFile = bucket.file(fileName)
    const blob = await file.arrayBuffer();
    const data = Buffer.from(blob);
    const result = await newFile.save(data, {
      contentType: 'image.jpeg'
    });

    // newFile.makePublic();
    console.log(newFile.publicUrl())
    // temp.save(Buffer.from(blob), {
    //   contentType: 'image/jpeg'
    // },function(err) {
    //   console.log(err)
    // })

    // const myData = await file.arrayBuffer();
    // const storage = new Storage();
    // const bucket = storage.bucket("busser");

    // const blob = bucket.file("myFile");
    // const blobStream = blob.createWriteStream({
    //   resumable: false,
    // });

    // blobStream.end(Buffer.from(myData));

  } catch(error) {
    console.error(error)
  }
}
