
import { S3Client } from "@aws-sdk/client-s3";

if (!process.env.AWS_REGION) {
  throw new Error("AWS_REGION environment variable is not set");
}
if (!process.env.AWS_ACCESS_KEY_ID) {
  throw new Error("AWS_ACCESS_KEY_ID environment variable is not set");
}
if (!process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error("AWS_SECRET_ACCESS_KEY environment variable is not set");
}
if(!process.env.AWS_S3_MEDIA_BUCKET_NAME){
  throw new Error("AWS_S3_MEDIA_BUCKET_NAME environment variable is not set");
}
if(!process.env.AWS_S3_MEDIA_FOLDER){
  throw new Error("AWS_S3_MEDIA_FOLDER environment variable is not set");
}

const s3Client=new S3Client({
    region: process.env.AWS_REGION,
    credentials:{
        accessKeyId:process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY
    }
})
export default s3Client;

export const MEDIA_BUCKET_NAME=process.env.AWS_S3_MEDIA_BUCKET_NAME;
export const MEDIA_FOLDER=process.env.AWS_S3_MEDIA_FOLDER;