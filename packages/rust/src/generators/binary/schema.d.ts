export interface RustBinaryGeneratorSchema {
  name: string;
  edition?: '2015' | '2018' | '2021';
  tags?: string;
  directory?: string;
}
