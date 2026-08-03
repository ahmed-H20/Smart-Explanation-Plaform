exports.studentCreateOrder = (order, studentName) => `
<div style="font-family: Arial, sans-serif; background-color:#f4f6f9; padding:40px;">
  <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 5px 20px rgba(0,0,0,0.08);">
    
    <div style="background: linear-gradient(90deg,#0f2027,#2c5364); padding:20px; text-align:center;">
      <h2 style="color:#ffffff; margin:0;">🎉 تم إنشاء الطلب بنجاح</h2>
    </div>

    <div style="padding:30px; color:#333; direction:rtl; text-align:right;">
      <p>مرحبًا <strong>${studentName}</strong>،</p>

      <p>تم إنشاء طلبك بنجاح وإرساله للمدرس.</p>

      <div style="background:#f1f5f9; padding:20px; border-radius:8px; margin:20px 0;">
        <p><strong>رقم الطلب:</strong> ${order._id}</p>
        <p><strong>المبلغ المحجوز:</strong> ${order.studentPrice} ${order.studentCurrency}</p>
        <p><strong>الموعد النهائي:</strong> ${new Date(order.deadline).toDateString()}</p>
      </div>

      <p>تم تجميد المبلغ مؤقتًا في محفظتك حتى يتم تسليم العمل.</p>
    </div>
  </div>
</div>
`;

exports.instructorCreateOrder = (order, instructorName) => `
<div style="font-family: Arial, sans-serif; background-color:#f4f6f9; padding:40px;">
  <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 5px 20px rgba(0,0,0,0.08);">
    
    <div style="background: linear-gradient(90deg,#1e3c72,#2a5298); padding:20px; text-align:center;">
      <h2 style="color:#ffffff; margin:0;">📚 تم إسناد طلب جديد لك</h2>
    </div>

    <div style="padding:30px; color:#333; direction:rtl; text-align:right;">
      <p>مرحبًا <strong>${instructorName}</strong>،</p>

      <p>تم إسناد طلب جديد من أحد الطلاب إليك.</p>

      <div style="background:#eef2ff; padding:20px; border-radius:8px; margin:20px 0;">
        <p><strong>رقم الطلب:</strong> ${order._id}</p>
        <p><strong>أرباحك:</strong> ${order.instructorPrice} ${order.instructorCurrency}</p>
        <p><strong>الموعد النهائي:</strong> ${new Date(order.deadline).toDateString()}</p>
      </div>
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

exports.newAssignmentRequestTemplate = (request, instructorName) => `
<div style="font-family: Arial, sans-serif; background-color:#f4f6f9; padding:40px;">
  <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 5px 20px rgba(0,0,0,0.08);">
    
    <div style="background: linear-gradient(90deg,#134e5e,#71b280); padding:20px; text-align:center;">
      <h2 style="color:#ffffff; margin:0;">📩 طلب واجب جديد</h2>
    </div>

    <div style="padding:30px; color:#333; direction:rtl; text-align:right;">
      <p>مرحبًا <strong>${instructorName}</strong>،</p>

      <p>قام أحد الطلاب بإنشاء طلب واجب جديد يمكنك تقديم عرض عليه.</p>

      <div style="background:#f1f5f9; padding:20px; border-radius:8px; margin:20px 0;">
        <p><strong>الميزانية:</strong> ${request.budget} ${request.student.country.currencyCode}</p>
        <p><strong>الموعد النهائي:</strong> ${new Date(request.deadline).toDateString()}</p>
      </div>

      <p>قم بالدخول إلى المنصة لإرسال عرضك الآن.</p>
    </div>
  </div>
</div>
`;

exports.newDirectRequestTemplate = (request, instructorName) => `
  <div style="font-family: Arial, sans-serif; background-color:#f4f6f9; padding:40px;">
  <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 5px 20px rgba(0,0,0,0.08);">
    
    <div style="background: linear-gradient(90deg,#42275a,#734b6d); padding:20px; text-align:center;">
      <h2 style="color:#ffffff; margin:0;">⭐ طلب مباشر جديد</h2>
    </div>

    <div style="padding:30px; color:#333; direction:rtl; text-align:right;">
      <p>مرحبًا <strong>${instructorName}</strong>،</p>

      <p>لديك طلب مباشر جديد من أحد الطلاب.</p>

      <div style="background:#f3e8ff; padding:20px; border-radius:8px; margin:20px 0;">
        <p><strong>الميزانية:</strong> ${request.budget} ${request.student.country.currencyCode}</p>
        <p><strong>الموعد النهائي:</strong> ${new Date(request.deadline).toDateString()}</p>
      </div>

      <p>يرجى مراجعة الطلب والرد عليه في أقرب وقت.</p>
    </div>
  </div>
</div>
`;

exports.acceptDirectRequestTemplate = (
	order,
	studentName,
	instructorName,
	paidBySubscription,
) => `
  <div style="font-family: Arial, sans-serif; background-color:#f4f6f9; padding:40px;">
    <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 5px 20px rgba(0,0,0,0.08);">

      <!-- Header -->
      <div style="background: linear-gradient(90deg,#42275a,#734b6d); padding:20px; text-align:center;">
        <h2 style="color:#ffffff; margin:0;">🎉 تم قبول طلبك المباشر</h2>
      </div>

      <!-- Body -->
      <div style="padding:30px; color:#333; direction:rtl; text-align:right;">
        <p>مرحبًا <strong>${studentName}</strong>،</p>

        <p>
          يسعدنا إخبارك بأن المدرب <strong>${instructorName}</strong>
          قد قبل طلبك المباشر وسيبدأ العمل عليه في أقرب وقت.
        </p>

        <!-- Order Details -->
        <div style="background:#f3e8ff; padding:20px; border-radius:8px; margin:20px 0;">
          <h3 style="margin-top:0; color:#42275a;">📋 تفاصيل الطلب</h3>
          <p><strong>رقم الطلب:</strong> ${order._id}</p>
          <p><strong>المدرب:</strong> ${instructorName}</p>
          <p><strong>الموعد النهائي:</strong> ${new Date(order.deadline).toLocaleDateString("ar-EG")}</p>
          <p><strong>تاريخ البدء:</strong> ${new Date(order.startedAt).toLocaleDateString("ar-EG")}</p>
        </div>

        <!-- Payment Details -->
        <div style="background:#e8f5e9; padding:20px; border-radius:8px; margin:20px 0;">
          <h3 style="margin-top:0; color:#2e7d32;">💳 تفاصيل الدفع</h3>
          ${
						paidBySubscription
							? `<p style="color:#2e7d32; font-weight:bold;">✅ تم تغطية هذا الطلب باشتراكك الحالي — لم يتم خصم أي مبلغ.</p>`
							: `<p><strong>المبلغ المخصوم:</strong> ${order.studentPrice} ${order.studentCurrency}</p>
                 <p><strong>حالة الدفع:</strong> <span style="color:#2e7d32;">مكتمل ✅</span></p>`
					}
        </div>

        <p style="color:#777; font-size:13px;">
          إذا كان لديك أي استفسار، يرجى التواصل مع فريق الدعم.
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#f4f6f9; padding:15px; text-align:center; font-size:12px; color:#999;">
        <p style="margin:0;">© ${new Date().getFullYear()} منصتك التعليمية. جميع الحقوق محفوظة.</p>
      </div>

    </div>
  </div>
`;

exports.passwordResetTemplate = (resetCode, userName) => `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color:#f8fafc; padding:45px 20px; direction:rtl; text-align:right;">
  <div style="max-width:550px; margin:auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
    
    <!-- Top Decorative Gradient Bar -->
    <div style="background: linear-gradient(135deg, #4f46e5, #6366f1); padding:35px 20px; text-align:center; color:#ffffff;">
      <h2 style="margin:0; font-size:24px; font-weight:700; letter-spacing: -0.5px;">🔒 إعادة تعيين كلمة المرور</h2>
      <p style="margin:8px 0 0 0; font-size:14px; color:#e0e7ff; letter-spacing: 0.5px;">Password Reset Request</p>
    </div>

    <!-- Main Content -->
    <div style="padding:40px 35px; color:#1e293b; line-height:1.7;">
      <p style="font-size:16px; margin-top:0;">مرحباً <strong>${userName}</strong>،</p>

      <p style="font-size:15px; color:#475569;">
        لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك على <strong>منصة Smart Explanation</strong>. يرجى استخدام رمز التحقق التالي لإتمام العملية:
      </p>
      
      <!-- Code Display Block -->
      <div style="background:#f1f5f9; border: 1px dashed #cbd5e1; padding:25px; border-radius:12px; margin:30px 0; text-align:center;">
        <span style="font-family: 'Courier New', Courier, monospace; font-size:36px; font-weight:bold; letter-spacing:8px; color:#4f46e5; display:inline-block;">${resetCode}</span>
        <p style="margin:8px 0 0 0; font-size:12px; color:#64748b;">هذا الرمز صالح لمدة 10 دقائق فقط</p>
      </div>

      <p style="font-size:14px; color:#64748b; background-color:#fffbeb; border-right: 4px solid #f59e0b; padding:12px 16px; border-radius:4px; margin-bottom:30px;">
        ⚠️ <strong>تنبيه:</strong> إذا لم تقم بطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد الإلكتروني بأمان وسيظل حسابك آمناً.
      </p>

      <hr style="border:0; border-top: 1px solid #f1f5f9; margin:30px 0;" />

      <!-- English Section -->
      <div style="direction:ltr; text-align:left; font-size:14px; color:#64748b; line-height:1.6;">
        <p style="margin-top:0;">Hello <strong>${userName}</strong>,</p>
        <p>
          We received a request to reset your password for your <strong>Smart Explanation Platform</strong> account. Use the verification code above to complete your reset. This code is valid for 10 minutes.
        </p>
        <p style="font-size:12px; color:#94a3b8; margin-top:15px;">
          If you did not request a password reset, please ignore this email.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc; padding:20px; text-align:center; font-size:12px; color:#94a3b8; border-top: 1px solid #f1f5f9;">
      <p style="margin:0;">منصة Smart Explanation © ${new Date().getFullYear()}</p>
      <p style="margin:4px 0 0 0; font-size:11px; color:#cbd5e1;">All rights reserved.</p>
    </div>

  </div>
</div>
`;

