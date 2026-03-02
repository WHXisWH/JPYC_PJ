import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('AccessPassNFT', () => {
  it('only operator can mint', async () => {
    const [owner, operator, user] = await ethers.getSigners();
    const AccessPass = await ethers.getContractFactory('AccessPassNFT');
    const nft = await AccessPass.deploy('NodeStay Pass', 'NSP');

    await expect(nft.connect(operator).mint(user.address)).to.be.revertedWithCustomError(nft, 'NotOperator');
    await expect(nft.connect(owner).setOperator(operator.address)).to.emit(nft, 'OperatorUpdated');
    await expect(nft.connect(operator).mint(user.address)).to.emit(nft, 'Transfer');
  });

  it('owner can set operator, rejects zero', async () => {
    const [owner, other] = await ethers.getSigners();
    const AccessPass = await ethers.getContractFactory('AccessPassNFT');
    const nft = await AccessPass.deploy('NodeStay Pass', 'NSP');
    await expect(nft.connect(owner).setOperator(ethers.ZeroAddress)).to.be.revertedWithCustomError(nft, 'ZeroAddress');
    await expect(nft.connect(other).setOperator(other.address)).to.be.revertedWithCustomError(
      nft,
      'OwnableUnauthorizedAccount',
    );
  });
});
