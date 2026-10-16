import { Preference } from '../models/Preference.js'
import { asyncHandler } from '../http.js'

export const getMine = asyncHandler(async (req, res) => {
  let preference = await Preference.findOne({ student: req.user._id })
  if (!preference) {
    preference = await Preference.create({ student: req.user._id, emailEnabled: true, tomiEnabled: true })
  }
  res.json({ emailEnabled: preference.emailEnabled, tomiEnabled: preference.tomiEnabled })
})

export const updateMine = asyncHandler(async (req, res) => {
  const preference = await Preference.findOneAndUpdate(
    { student: req.user._id },
    {
      emailEnabled: Boolean(req.body.emailEnabled),
      tomiEnabled: Boolean(req.body.tomiEnabled),
    },
    { new: true, upsert: true }
  )
  res.json({ emailEnabled: preference.emailEnabled, tomiEnabled: preference.tomiEnabled })
})
