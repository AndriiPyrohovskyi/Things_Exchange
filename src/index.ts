import "reflect-metadata"
import { AppDataSource } from "../data-source"

AppDataSource.initialize().then(async () => {
    console.log("Data Source has been initialized!")
}).catch(error => console.log(error))