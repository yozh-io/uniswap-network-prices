const express = require('express')
const fs = require("fs");
const path = require('path');
const cors = require('cors')
const {PoolABI} = require("./abi");
const app = express()
const { BigNumber, providers, Contract, constants, utils } = require("ethers");
const port = 3000

app.use(cors())


function parsePrices() {
  try {
    parsePriceAtETH();
    parsePriceAtPolygon();
    parsePriceAtArbitrum();
    parsePriceAtBase();
  } catch (e) {
    console.error('Error while parsing price from networks', e);
  }
}

function getPriceFromSqrtPrice(sqrtPriceX96, token0Decimals, token1Decimals) {
  const denominator = constants.Two.pow(192);

  if (token0Decimals > token1Decimals) {
    return utils.formatUnits(
      sqrtPriceX96
        .pow(constants.Two)
        .mul(BigNumber.from(10).pow(token0Decimals))
        .div(denominator),
      token1Decimals
    );
  }

  return utils.formatUnits(
    sqrtPriceX96.pow(constants.Two).div(denominator),
    Math.abs(token0Decimals - token1Decimals)
  );
}

async function parsePriceAtETH() {
  const chainId = 1;
  const rpc = 'https://eth-mainnet.g.alchemy.com/v2/Q4mtgk6C7oXVylbAcoD2lzBUEWMDhSyk';
  const poolAddress = '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640'; // USDC/ETH 0.05
  const provider = new providers.StaticJsonRpcProvider(rpc, chainId);
  const poolContract = new Contract(poolAddress, PoolABI, provider);

  const firstBlockOfPeriod = 16308189; // Dec-31-2022 11:59:59 PM +UTC
  const currentBlock = await provider.getBlockNumber();

  for (let blockTag = firstBlockOfPeriod; blockTag <= currentBlock; blockTag++) {
    try {
      const { sqrtPriceX96 } = await poolContract.slot0({ blockTag });
      const price = getPriceFromSqrtPrice(sqrtPriceX96, 6, 18);
      const { timestamp } = await provider.getBlock(blockTag);
      saveETHPriceToJSON({timestamp, price: 1/Number(price), blockNumber: blockTag})
    } catch (e) {
      console.error(`Error in parsing price in ETH from blockNumber: ${blockTag}`, e);
      continue;
    }
  }
}

async function parsePriceAtPolygon() {
  const chainId = 137;
  const rpc = 'https://polygon-rpc.com';
  const poolAddress = '0x45dDa9cb7c25131DF268515131f647d726f50608'; // USDC/ETH 0.05
  const provider = new providers.StaticJsonRpcProvider(rpc, chainId);
  const poolContract = new Contract(poolAddress, PoolABI, provider);

  const firstBlockOfPeriod = 37520356; // ?? Jan-1-2023 12:00:01 PM +UTC
  const currentBlock = await provider.getBlockNumber();

  for (let blockTag = firstBlockOfPeriod; blockTag <= currentBlock; blockTag++) {
    try {
      const { sqrtPriceX96 } = await poolContract.slot0({ blockTag });
      const { timestamp } = await provider.getBlock(blockTag);
      const price = getPriceFromSqrtPrice(sqrtPriceX96, 6, 18);
      savePolygonPriceToJSON({timestamp, price: 1/Number(price), blockNumber: blockTag})
    } catch (e) {
      console.error(`Error in parsing price in Polygon from blockNumber: ${blockTag}`, e);
      continue;
    }
  }
}

async function parsePriceAtArbitrum() {
  const chainId = 42161;
  const rpc = 'https://arbitrum.public-rpc.com';
  const poolAddress = '0xC31E54c7a869B9FcBEcc14363CF510d1c41fa443'; // ETH/USDC 0.05
  const provider = new providers.StaticJsonRpcProvider(rpc, chainId);
  const poolContract = new Contract(poolAddress, PoolABI, provider);

  const firstBlockOfPeriod = 50084142; // ?? Jan-1-2023 12:00:00 PM +UTC
  const currentBlock = await provider.getBlockNumber();

  for (let blockTag = firstBlockOfPeriod; blockTag <= currentBlock; blockTag++) {
    try {
      const { sqrtPriceX96 } = await poolContract.slot0({ blockTag });
      const { timestamp } = await provider.getBlock(blockTag);
      const price = getPriceFromSqrtPrice(sqrtPriceX96, 18, 6);
      saveArbitrumPriceToJSON({timestamp, price, blockNumber: blockTag})
    } catch (e) {
      console.error(`Error in parsing price in Arbitrum from blockNumber: ${blockTag}`, e);
      continue;
    }
  }
}

async function parsePriceAtBase() {
  const chainId = 8453;
  const rpc = 'https://base.meowrpc.com';
  const poolAddress = '0xd0b53D9277642d899DF5C87A3966A349A798F224'; // ETH/USDC 0.05
  const provider = new providers.StaticJsonRpcProvider(rpc, chainId);
  const poolContract = new Contract(poolAddress, PoolABI, provider);

  const firstBlockOfPeriod = 3620407; // Sep-06-2023 07:56:01 PM +UTC
  const currentBlock = await provider.getBlockNumber();

  for (let blockTag = firstBlockOfPeriod; blockTag <= currentBlock; blockTag++) {
    try {
      const { sqrtPriceX96 } = await poolContract.slot0({ blockTag });
      const { timestamp } = await provider.getBlock(blockTag);
      const price = getPriceFromSqrtPrice(sqrtPriceX96, 18, 6);
      saveBasePriceToJSON({timestamp, price, blockNumber: blockTag})
    } catch (e) {
      console.error(`Error in parsing price in Base from blockNumber: ${blockTag}`, e);
      continue;
    }
  }
}

// Function to save the price to a local JSON file
function saveETHPriceToJSON(data) {
  fs.appendFileSync("ETHPrices.json", JSON.stringify(data) + ",\n");
}

function savePolygonPriceToJSON(data) {
  fs.appendFileSync("PolygonPrices.json", JSON.stringify(data) + ",\n");
}

function saveArbitrumPriceToJSON(data) {
  fs.appendFileSync("ArbitrumPrices.json", JSON.stringify(data) + ",\n");
}

function saveBasePriceToJSON(data) {
  fs.appendFileSync("BasePrices.json", JSON.stringify(data) + ",\n");
}

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
  //__dirname : It will resolve to your project folder.
});

app.get('/api/prices/ETH', (req, res) => {
  const prices = fs.readFileSync("ETHPrices.json", "utf8");
  let lastCommaIndex = prices.lastIndexOf(",");
  const parsedPrices = JSON.parse(`[${prices.slice(0, lastCommaIndex)}]`);
  res.json(parsedPrices)
});

app.get('/api/prices/Polygon', (req, res) => {
  const prices = fs.readFileSync("PolygonPrices.json", "utf8");
  let lastCommaIndex = prices.lastIndexOf(",");
  const parsedPrices = JSON.parse(`[${prices.slice(0, lastCommaIndex)}]`);
  res.json(parsedPrices)
});

app.get('/api/prices/Arbitrum', (req, res) => {
  const prices = fs.readFileSync("ArbitrumPrices.json", "utf8");
  let lastCommaIndex = prices.lastIndexOf(",");
  const parsedPrices = JSON.parse(`[${prices.slice(0, lastCommaIndex)}]`);
  res.json(parsedPrices)
});

app.get('/api/prices/Base', (req, res) => {
  const prices = fs.readFileSync("BasePrices.json", "utf8");
  let lastCommaIndex = prices.lastIndexOf(",");
  const parsedPrices = JSON.parse(`[${prices.slice(0, lastCommaIndex)}]`);
  res.json(parsedPrices)
});

app.listen(port, () => {
  parsePrices();
  console.log(`Example app listening on port ${port}`)
})
