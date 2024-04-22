import expressAsyncHandler from "express-async-handler";
import axios from "axios";
import ContentHistory from "../models/ContentHistory.model.js";
import User from "../models/User.model.js";

// OPEN AI CONTROLLER
export const openAICtrl = expressAsyncHandler(async (req, res) => {
    const { prompt } = req.body

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/completions',
            {
                model: 'gpt-3.5-turbo-instruct',
                prompt,
                max_tokens: 5
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPEN_API_KEY}`,
                    "Content-Type": "application/json"
                }
            })

        // send the response
        const content = response?.data?.choices[0].text?.trim()

        // create the history
        const newContent = await ContentHistory.create({
            user: req?.user?._id,
            content
        })

        // push the history to the user
        const userFound = await User.findById(req?.user?.id)
        userFound.contentHistory.push(newContent?._id)

        // Update the api request count
        userFound.apiRequestCount += 1

        // save the user
        await userFound.save()

        res.status(200).json(content)
    } catch (error) {
        throw new Error(error)
    }
})