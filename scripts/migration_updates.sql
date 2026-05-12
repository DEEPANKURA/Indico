UPDATE posts SET media_urls = ARRAY['https://res.cloudinary.com/dm6nsathe/image/upload/v1778555992/posts_migrated/gwdpkibh4ibncwpnszpc.jpg'] WHERE id = '37acb8a5-6219-403c-8316-df29ce7a80d5';
UPDATE posts SET media_urls = ARRAY['https://res.cloudinary.com/dm6nsathe/image/upload/v1778555994/posts_migrated/o0ghe4yxgtri1zkktfmb.webp'] WHERE id = 'a3741e76-3462-4f88-82cb-5d4a3a809c48';
UPDATE posts SET media_urls = ARRAY['https://res.cloudinary.com/dm6nsathe/video/upload/v1778556006/posts_migrated/z9hmxoccbclgq9vfrsn6.mp4'] WHERE id = 'c458774a-9f9f-4b5a-8350-b965f4669a6d';
UPDATE posts SET media_urls = ARRAY['https://res.cloudinary.com/dm6nsathe/image/upload/v1778556009/posts_migrated/qsg37uhy7tmqvxgjxmjy.png'] WHERE id = '747a6125-d1fb-4710-86fe-49bedf533c70';
UPDATE posts SET media_urls = ARRAY['https://res.cloudinary.com/dm6nsathe/video/upload/v1778556011/posts_migrated/s4oc6zmvy2cemo4pxlco.mp4'] WHERE id = '84029db4-2943-45ad-b7f0-6036131fa637';
UPDATE posts SET media_urls = ARRAY['https://res.cloudinary.com/dm6nsathe/video/upload/v1778556031/posts_migrated/y7wqjub5ngzf05vpywxi.mp4'] WHERE id = 'b3ebe68f-0ff2-4dd9-a280-dc98d284461b';
UPDATE posts SET media_urls = ARRAY['https://res.cloudinary.com/dm6nsathe/image/upload/v1778556035/posts_migrated/uej6jwrnwqbyi9dy2q0m.png'] WHERE id = '382e3ec3-ba7f-4e8d-b38d-69069c902546';
UPDATE posts SET media_urls = ARRAY['https://res.cloudinary.com/dm6nsathe/image/upload/v1778556037/posts_migrated/opjlx0ufsqjbj7lef4d5.png'] WHERE id = 'edd42846-b209-472d-b53f-6c89dd5618a2';
UPDATE posts SET media_urls = ARRAY['https://res.cloudinary.com/dm6nsathe/image/upload/v1778556038/posts_migrated/mhz8mllat1elj5kohfam.png'] WHERE id = '6e00f1fe-9d5a-4b9f-9976-ede339651cca';
UPDATE posts SET media_urls = ARRAY['https://res.cloudinary.com/dm6nsathe/video/upload/v1778556042/posts_migrated/ingznwcdxzszdtiridfz.mp4'] WHERE id = '1b3e4013-2c07-47b6-a4ef-bc3da23f2b92';
UPDATE posts SET media_urls = ARRAY['https://res.cloudinary.com/dm6nsathe/image/upload/v1778556045/posts_migrated/x3bawo79fokjvqfczadf.jpg'] WHERE id = '65c54aa3-3f6c-46bd-aaad-1bb916088b0c';
UPDATE posts SET media_urls = ARRAY['https://res.cloudinary.com/dm6nsathe/video/upload/v1778556049/posts_migrated/zlussek3om7vz97avyvp.mp4'] WHERE id = 'd4eed04d-fec1-4036-9936-1a775c5d7a59';
UPDATE profiles SET avatar_url = 'https://res.cloudinary.com/dm6nsathe/image/upload/v1778556051/avatars_migrated/vhbzydpecfhsbtlgkczm.jpg?v=1778556052734' WHERE id = '49f1d16b-400e-4b08-a857-57eba13ab2b3';
UPDATE profiles SET avatar_url = 'https://res.cloudinary.com/dm6nsathe/image/upload/v1778556053/avatars_migrated/z6eatdehghxyobmnojcq.jpg?v=1778556054312' WHERE id = 'aa13139c-a2b7-4f81-8772-fa36b6980bd6';
UPDATE profiles SET avatar_url = 'https://res.cloudinary.com/dm6nsathe/image/upload/v1778556055/avatars_migrated/vl8hakrssprcwybegqkk.jpg?v=1778556055925' WHERE id = '0e803975-2906-423d-813d-19861fca6647';
UPDATE profiles SET avatar_url = 'https://res.cloudinary.com/dm6nsathe/image/upload/v1778556056/avatars_migrated/zjwje1iukvtgntn3ak7s.png?v=1778556057522' WHERE id = '528f1123-1155-484c-8a98-2785a8e1b74a';
UPDATE profiles SET avatar_url = 'https://res.cloudinary.com/dm6nsathe/image/upload/v1778556058/avatars_migrated/hew9xskpyymcgajd758b.webp?v=1778556059197' WHERE id = '39de3618-8f15-452e-b1e2-d4f6ad89520e';
UPDATE profiles SET avatar_url = 'https://res.cloudinary.com/dm6nsathe/image/upload/v1778556060/avatars_migrated/uqszieaw3qfxkxstzduj.jpg?v=1778556060869' WHERE id = '490521c8-37cb-4e2d-8a6c-4f79a8ddcec0';

-- Free up physical storage space instantly
DELETE FROM storage.objects WHERE bucket_id IN ('media', 'avatars');