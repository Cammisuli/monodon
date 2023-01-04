export interface RustLibraryGeneratorSchema {
  name: string;
  edition?: '2015' | '2018' | '2021';
  tags?: string;
  directory?: string;
  wasm?: boolean;
  napi?: boolean;
}
