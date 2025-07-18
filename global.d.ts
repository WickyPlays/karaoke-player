declare module "spessasynth_lib" {
  export class Synthetizer {
    constructor(
      audioDestinationNode: AudioDestinationNode,
      arrayBuffer: ArrayBuffer
    );

    [key: string]: any;
  }
}
