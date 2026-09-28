import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("MonadStreamModule", (m) => {
  const stream = m.contract("MonadStream",["0xa9012a055bd4e0eDfF8Ce09f960291C09D5322dC"]);

  return { stream };
});