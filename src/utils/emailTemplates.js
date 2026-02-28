exports.studentCreateOrder = (order, studentName) => `
<div style="font-family: Arial, sans-serif; background-color:#f4f6f9; padding:40px;">
  <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 5px 20px rgba(0,0,0,0.08);">
    
    <div style="background: linear-gradient(90deg,#0f2027,#2c5364); padding:20px; text-align:center;">
      <h2 style="color:#ffffff; margin:0;">🎉 Order Created Successfully</h2>
    </div>

    <div style="padding:30px; color:#333;">
      <p>Hi <strong>${studentName}</strong>,</p>

      <p>Your order has been created successfully and sent to the instructor.</p>

      <div style="background:#f1f5f9; padding:20px; border-radius:8px; margin:20px 0;">
        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>Amount Frozen:</strong> ${order.studentPrice} ${order.studentCurrency}</p>
        <p><strong>Deadline:</strong> ${new Date(order.deadline).toDateString()}</p>
      </div>

      <p>The amount has been temporarily frozen in your wallet until the instructor completes the work.</p>

      <div style="text-align:center; margin-top:30px;">
        <a href="#" style="background:#2c5364; color:white; padding:12px 25px; border-radius:6px; text-decoration:none;">
          View Order
        </a>
      </div>
    </div>

    <div style="background:#f8fafc; padding:15px; text-align:center; font-size:12px; color:#777;">
      Smart Explanation Platform © ${new Date().getFullYear()}
    </div>

  </div>
</div>
`;

exports.instructorCreateOrder = (order, instructorName) => `
<div style="font-family: Arial, sans-serif; background-color:#f4f6f9; padding:40px;">
  <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 5px 20px rgba(0,0,0,0.08);">
    
    <div style="background: linear-gradient(90deg,#1e3c72,#2a5298); padding:20px; text-align:center;">
      <h2 style="color:#ffffff; margin:0;">📚 New Order Assigned</h2>
    </div>

    <div style="padding:30px; color:#333;">
      <p>Hello <strong>${instructorName}</strong>,</p>

      <p>You have received a new order from a student.</p>

      <div style="background:#eef2ff; padding:20px; border-radius:8px; margin:20px 0;">
        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>Your Earnings:</strong> ${order.instructorPrice} ${order.instructorCurrency}</p>
        <p><strong>Deadline:</strong> ${new Date(order.deadline).toDateString()}</p>
      </div>

      <div style="text-align:center; margin-top:30px;">
        <a href="#" style="background:#2a5298; color:white; padding:12px 25px; border-radius:6px; text-decoration:none;">
          Start Working
        </a>
      </div>
    </div>

    <div style="background:#f8fafc; padding:15px; text-align:center; font-size:12px; color:#777;">
      Smart Explanation Platform © ${new Date().getFullYear()}
    </div>

  </div>
</div>
`;

exports.studentAcceptedOfferTemplate = (offer, studentName) => `
<div style="font-family: Arial, sans-serif; background-color:#f4f6f9; padding:40px;">
  <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 5px 20px rgba(0,0,0,0.08);">
    
    <div style="background: linear-gradient(90deg,#0f2027,#2c5364); padding:20px; text-align:center;">
      <h2 style="color:#ffffff; margin:0;">🎉 You Accepted the Offer!</h2>
    </div>

    <div style="padding:30px; color:#333;">
      <p>Hi <strong>${studentName}</strong>,</p>

      <p>You have successfully accepted the instructor's offer. Your order is now confirmed! ✅</p>

      <div style="background:#f1f5f9; padding:20px; border-radius:8px; margin:20px 0;">
        <p><strong>Offer ID:</strong> ${offer._id}</p>
        <p><strong>Amount Paid:</strong> ${offer.studentPrice} ${offer.studentCurrency}</p>
        <p><strong>Instructor Price:</strong> ${offer.instructorPrice} ${offer.instructorCurrency}</p>
        <p><strong>Deadline:</strong> ${new Date(offer.request.deadline).toDateString()}</p>
      </div>

      <p>You can now track the order and communicate with the instructor through the platform.</p>

      <div style="text-align:center; margin-top:30px;">
        <a href="#" style="background:#2c5364; color:white; padding:12px 25px; border-radius:6px; text-decoration:none;">
          View Order
        </a>
      </div>
    </div>

    <div style="background:#f8fafc; padding:15px; text-align:center; font-size:12px; color:#777;">
      Smart Explanation Platform © ${new Date().getFullYear()}
    </div>

  </div>
</div>
`;

exports.instructorOfferAcceptedTemplate = (offer, instructorName) => `
<div style="font-family: Arial, sans-serif; background-color:#f4f6f9; padding:40px;">
  <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 5px 20px rgba(0,0,0,0.08);">
    
    <div style="background: linear-gradient(90deg,#1e3c72,#2a5298); padding:20px; text-align:center;">
      <h2 style="color:#ffffff; margin:0;">✅ Student Accepted Your Offer!</h2>
    </div>

    <div style="padding:30px; color:#333;">
      <p>Hello <strong>${instructorName}</strong>,</p>

      <p>The student has accepted your offer. The order is now confirmed and ready for you to start working. 🎓</p>

      <div style="background:#eef2ff; padding:20px; border-radius:8px; margin:20px 0;">
        <p><strong>Offer ID:</strong> ${offer._id}</p>
        <p><strong>Student Paid:</strong> ${offer.studentPrice} ${offer.studentCurrency}</p>
        <p><strong>Your Earnings:</strong> ${offer.instructorPrice} ${offer.instructorCurrency}</p>
        <p><strong>Deadline:</strong> ${new Date(offer.request.deadline).toDateString()}</p>
      </div>

      <div style="text-align:center; margin-top:30px;">
        <a href="#" style="background:#2a5298; color:white; padding:12px 25px; border-radius:6px; text-decoration:none;">
          Start Working
        </a>
      </div>
    </div>

    <div style="background:#f8fafc; padding:15px; text-align:center; font-size:12px; color:#777;">
      Smart Explanation Platform © ${new Date().getFullYear()}
    </div>

  </div>
</div>
`;
