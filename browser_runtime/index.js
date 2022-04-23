import { runProgram } from "./runner.js"
import fs from "fs"
import { dirname, join as pathJoin } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url))

const cliArgs = process.argv.slice(2);
const filePath = cliArgs[0] ?? pathJoin(__dirname, "..", "examples", "average_of_2.stackdemo")

fs.readFile(filePath, 'utf8' , (err, data) => {
  if (err) {
    console.error(err)
    return
  }
  runProgram(data)
})
