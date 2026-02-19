const EnquiryModel = require('../models/user');

const enquiryinsert = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !phone || !message) {
      return res.status(400).send({
        status: 0,
        message: "All fields are required"
      });
    }

    const newEnquiry = new EnquiryModel({
      name,
      email,
      phone,
      message
    });

    await newEnquiry.save();

    res.status(201).send({
      status: 1,
      message: "Enquiry inserted successfully",
      data: newEnquiry
    });

  } catch (error) {
    console.log(error);
    res.status(500).send({
      status: 0,
      message: "Server Error"
    });
  }
};

let enquirylist = async (req, res) => {
  try {
    let enquiry = await EnquiryModel.find();

    res.send({
      status: 1,
      enquiry: enquiry   // ✅ correct key name
    });

  } catch (error) {
    res.send({
      status: 0,
      message: "Error fetching data"
    });
  }
};

module.exports = { enquiryinsert,enquirylist };
