import { Router } from "express";

const shareCodeRouter = Router();

shareCodeRouter.get("/:code", (req, res) => {
    const codeRegex = /^CSGO-[A-Za-z0-9]{5}-[A-Za-z0-9]{5}-[A-Za-z0-9]{5}-[A-Za-z0-9]{5}-[A-Za-z0-9]{5}$/

    //Ensure that the code is valid
    if (!codeRegex.test(req.params.code)) {
      res.status(400).json({"error": "Invalid share code"});
      return;
    }


  res.json({"code": req.params.code});
});


export default shareCodeRouter;