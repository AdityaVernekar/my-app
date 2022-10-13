export default async function handler(req, res) {
  const tokenId = req.query.tokenId;

  const name = `CryptoDev #${tokenId}`;
  const description = `CryptoDev #${tokenId} is a unique NFT that can be used to represent a developer in the WEB3 space.`;
  const image = `https://raw.githubusercontent.com/LearnWeb3DAO/NFT-Collection/main/my-app/public/cryptodevs/${
    Number(tokenId) - 1
  }.svg`;

  res.status(200).json({
    name,
    description,
    image,
  });
}
