import fs from 'fs';
import crypto from 'crypto';

const posts = [
  { id: '37acb8a5-6219-403c-8316-df29ce7a80d5', url: 'https://zmtohgjowcntyhuiuqop.supabase.co/storage/v1/object/public/media/0e803975-2906-423d-813d-19861fca6647/blcraqh0oe8_1778349101098.jpg' },
  { id: 'a3741e76-3462-4f88-82cb-5d4a3a809c48', url: 'https://zmtohgjowcntyhuiuqop.supabase.co/storage/v1/object/public/media/aa13139c-a2b7-4f81-8772-fa36b6980bd6/qb9t60454e_1778347960339.webp' },
  { id: 'c458774a-9f9f-4b5a-8350-b965f4669a6d', url: 'https://zmtohgjowcntyhuiuqop.supabase.co/storage/v1/object/public/media/49f1d16b-400e-4b08-a857-57eba13ab2b3/1778213787587.mp4' },
  { id: '747a6125-d1fb-4710-86fe-49bedf533c70', url: 'https://zmtohgjowcntyhuiuqop.supabase.co/storage/v1/object/public/media/135fb2ff-c7a1-4d24-9839-75f5dcf4ea7c/8vaocw0exlg_1778399345067.png' },
  { id: '84029db4-2943-45ad-b7f0-6036131fa637', url: 'https://zmtohgjowcntyhuiuqop.supabase.co/storage/v1/object/public/media/248c237e-243c-4b87-847e-431d0ab4181e/365evdcsk5w_1778423349921.mp4' },
  { id: 'b3ebe68f-0ff2-4dd9-a280-dc98d284461b', url: 'https://zmtohgjowcntyhuiuqop.supabase.co/storage/v1/object/public/media/49f1d16b-400e-4b08-a857-57eba13ab2b3/1778434321368.mp4' },
  { id: '382e3ec3-ba7f-4e8d-b38d-69069c902546', url: 'https://zmtohgjowcntyhuiuqop.supabase.co/storage/v1/object/public/media/49f1d16b-400e-4b08-a857-57eba13ab2b3/p5jux9tl1a_1778475061515.png' },
  { id: 'edd42846-b209-472d-b53f-6c89dd5618a2', url: 'https://zmtohgjowcntyhuiuqop.supabase.co/storage/v1/object/public/media/135fb2ff-c7a1-4d24-9839-75f5dcf4ea7c/iyayai8j8ht_1778515362768.png' },
  { id: '6e00f1fe-9d5a-4b9f-9976-ede339651cca', url: 'https://zmtohgjowcntyhuiuqop.supabase.co/storage/v1/object/public/media/528f1123-1155-484c-8a98-2785a8e1b74a/1778303215497.png' },
  { id: '1b3e4013-2c07-47b6-a4ef-bc3da23f2b92', url: 'https://zmtohgjowcntyhuiuqop.supabase.co/storage/v1/object/public/media/32fcc479-945e-4df1-b798-78c8f2e3af1d/1778300089499.mp4' },
  { id: '65c54aa3-3f6c-46bd-aaad-1bb916088b0c', url: 'https://zmtohgjowcntyhuiuqop.supabase.co/storage/v1/object/public/media/49f1d16b-400e-4b08-a857-57eba13ab2b3/1778316875729.jpg' },
  { id: 'd4eed04d-fec1-4036-9936-1a775c5d7a59', url: 'https://zmtohgjowcntyhuiuqop.supabase.co/storage/v1/object/public/media/32fcc479-945e-4df1-b798-78c8f2e3af1d/1778300208854.mp4' }
];

const profiles = [
  { id: '49f1d16b-400e-4b08-a857-57eba13ab2b3', url: 'https://zmtohgjowcntyhuiuqop.supabase.co/storage/v1/object/public/avatars/49f1d16b-400e-4b08-a857-57eba13ab2b3/avatar_1778311409382.jpg?v=1778311411076' },
  { id: 'aa13139c-a2b7-4f81-8772-fa36b6980bd6', url: 'https://zmtohgjowcntyhuiuqop.supabase.co/storage/v1/object/public/avatars/aa13139c-a2b7-4f81-8772-fa36b6980bd6/avatar_1778348029716.jpg?v=1778348030729' },
  { id: '0e803975-2906-423d-813d-19861fca6647', url: 'https://zmtohgjowcntyhuiuqop.supabase.co/storage/v1/object/public/avatars/0e803975-2906-423d-813d-19861fca6647/avatar_1778349069559.jpg?v=1778349070314' },
  { id: '528f1123-1155-484c-8a98-2785a8e1b74a', url: 'https://zmtohgjowcntyhuiuqop.supabase.co/storage/v1/object/public/avatars/528f1123-1155-484c-8a98-2785a8e1b74a/avatar.png' },
  { id: '39de3618-8f15-452e-b1e2-d4f6ad89520e', url: 'https://zmtohgjowcntyhuiuqop.supabase.co/storage/v1/object/public/avatars/39de3618-8f15-452e-b1e2-d4f6ad89520e/avatar_1778393999212.webp?v=1778394000308' },
  { id: '490521c8-37cb-4e2d-8a6c-4f79a8ddcec0', url: 'https://zmtohgjowcntyhuiuqop.supabase.co/storage/v1/object/public/avatars/490521c8-37cb-4e2d-8a6c-4f79a8ddcec0/avatar_1778418802732.jpg?v=1778418803830' }
];

async function uploadToCloudinary(url, folder) {
  console.log(`Downloading asset: ${url}`);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Failed to fetch asset: ${url}, status: ${res.status}`);
      return null;
    }
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    
    // Clean url query params for extension check if needed
    const cleanUrl = url.split('?')[0];
    const contentType = res.headers.get('content-type') || 
      (cleanUrl.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg');
      
    const dataUri = `data:${contentType};base64,${base64}`;

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    const timestamp = Math.round(new Date().getTime() / 1000);
    const strToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(strToSign).digest('hex');

    const formData = new FormData();
    formData.append('file', dataUri);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', folder);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
    console.log(`Uploading to Cloudinary folder: ${folder}...`);
    const uploadRes = await fetch(uploadUrl, { method: 'POST', body: formData });
    const data = await uploadRes.json();
    
    if (!uploadRes.ok) {
      console.error('Cloudinary upload error:', data);
      return null;
    }
    console.log(`Successfully uploaded: ${data.secure_url}`);
    return data.secure_url;
  } catch (err) {
    console.error(`Error processing ${url}:`, err.message);
    return null;
  }
}

async function runMigration() {
  fs.mkdirSync('scripts', { recursive: true });
  const sqlCommands = [];

  console.log('--- STARTING POSTS MIGRATION ---');
  for (const post of posts) {
    const secureUrl = await uploadToCloudinary(post.url, 'posts_migrated');
    if (secureUrl) {
      sqlCommands.push(`UPDATE posts SET media_urls = ARRAY['${secureUrl}'] WHERE id = '${post.id}';`);
    }
  }

  console.log('\n--- STARTING PROFILES MIGRATION ---');
  for (const profile of profiles) {
    const secureUrl = await uploadToCloudinary(profile.url, 'avatars_migrated');
    if (secureUrl) {
      sqlCommands.push(`UPDATE profiles SET avatar_url = '${secureUrl}?v=${Date.now()}' WHERE id = '${profile.id}';`);
    }
  }

  // Append storage objects cleanup statement to immediately free up space
  sqlCommands.push(`\n-- Free up physical storage space instantly`);
  sqlCommands.push(`DELETE FROM storage.objects WHERE bucket_id IN ('media', 'avatars');`);

  const sqlFilePath = 'scripts/migration_updates.sql';
  fs.writeFileSync(sqlFilePath, sqlCommands.join('\n'));
  console.log(`\nSUCCESS: Generated full migration SQL updates file at ${sqlFilePath}`);
}

runMigration();
