# app.py - التطبيق الرئيسي المحسن والمعاد تنظيمه - نسخة مُصححة
"""
🚀 FC 26 Profile System - النسخة المعاد تنظيمها
================================================
تطبيق ويب متكامل لإدارة ملفات المستخدمين مع التحقق من الواتساب
والربط مع التليجرام وأنظمة الدفع المصرية

البنية الجديدة:
- وزارة التحقق (validators.py)
- وزارة التليجرام (telegram_manager.py)
- وزارة البيانات (profile_handler.py)
- وزارة الإعدادات (app_config.py)
"""

import json
import re  # 🔥 إضافة هذا الاستيراد المفقود
from datetime import datetime

from flask import jsonify, render_template, request, session



# ============================================================================
# 🏛️ الخطوة 1: استيراد جميع الوزارات مرة واحدة في الأعلى
# ============================================================================

# استيراد الوزارات المتخصصة
from app_config import app_config, create_flask_app, generate_csrf_token
from profile_handler import create_user_profile, profile_handler
from telegram_manager import (
    create_telegram_code,
    get_payment_display_text,
    process_telegram_webhook,
    telegram_manager,
)
from validators import (
    sanitize_input,
    validate_card_number,
    validate_instapay_link,
    validate_mobile_payment,
    validate_whatsapp_ultimate,
)

# ============================================================================
# 🚀 الخطوة 2: إنشاء التطبيق وتهيئته
# ============================================================================

# إنشاء التطبيق مع الإعدادات المحسنة
app = create_flask_app()


print("🚀 FC 26 Profile System بدأ التشغيل مع البنية المعاد تنظيمها")
print(f"📊 ملخص الإعدادات: {app_config.get_config_summary()}")

# تعيين webhook للتليجرام تلقائياً عند بدء التشغيل
if telegram_manager.bot_token:
    print("🔄 محاولة تعيين Telegram Webhook...")
    webhook_result = telegram_manager.set_webhook()
    if webhook_result.get('success'):
        print("✅ تم تعيين Telegram Webhook بنجاح")
    else:
        print(f"⚠️ فشل تعيين Webhook: {webhook_result.get('error')}")
else:
    print("⚠️ لا يمكن تعيين Webhook - TELEGRAM_BOT_TOKEN غير موجود")

# ============================================================================
# 🛡️ الخطوة 3: التحقق من الإعدادات (حارس البوابة)
# ============================================================================

# في بداية التطبيق
config_validation = app_config.validate_config()
if not config_validation[0]:
    print("❌ فشل في التحقق من الإعدادات:")
    for error in config_validation[1]:
        print(error)
    exit(1)


# ============================================================================
# 🔑 الخطوة 4: إعداد الجلسات والأمان
# ============================================================================

@app.before_request
def before_request():
    """تهيئة الجلسة - محدثة لحل مشاكل CSRF"""
    if "csrf_token" not in session:
        session["csrf_token"] = generate_csrf_token()
        session.permanent = True

# ============================================================================
# 🗺️ الخطوة 5: تعريف مسارات التطبيق (Routes)
# ============================================================================


@app.route("/")
def index():
    """الصفحة الرئيسية - محدثة"""
    # تأكد من وجود csrf token
    if "csrf_token" not in session:
        session["csrf_token"] = generate_csrf_token()
        session.permanent = True

    return render_template("index.html", csrf_token=session["csrf_token"])


@app.route("/validate-whatsapp", methods=["POST"])
def validate_whatsapp_endpoint():
    """API للتحقق المبتكر من رقم الواتساب - مُحسن مع الوزارة الجديدة"""
    try:
        data = request.get_json()
        phone = sanitize_input(data.get("phone", ""))

        if not phone:
            return jsonify({"is_valid": False, "error": "يرجى إدخال رقم الهاتف"})

        # استخدام وزارة التحقق الجديدة
        result = validate_whatsapp_ultimate(phone)
        return jsonify(result)

    except Exception as e:
        print(f"خطأ في التحقق من الواتساب: {str(e)}")
        return jsonify({"is_valid": False, "error": "خطأ في الخادم"})


@app.route("/update-profile", methods=["POST"])
def update_profile():
    """تحديث الملف الشخصي - محدثة مع الوزارات الجديدة"""
    try:
        client_ip = request.environ.get("HTTP_X_FORWARDED_FOR", request.remote_addr)
        user_agent = request.headers.get("User-Agent", "")

        # التحقق من CSRF
        token = request.form.get("csrf_token")
        session_token = session.get("csrf_token")

        if not token or not session_token or token != session_token:
            session["csrf_token"] = generate_csrf_token()
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "انتهت صلاحية الجلسة، يرجى إعادة تحميل الصفحة",
                        "error_code": "csrf_expired",
                        "new_csrf_token": session["csrf_token"],
                    }
                ),
                403,
            )

        # استخراج البيانات
        form_data = {
            "platform": sanitize_input(request.form.get("platform")),
            "whatsapp_number": sanitize_input(request.form.get("whatsapp_number")),
            "payment_method": sanitize_input(request.form.get("payment_method")),
            "payment_details": sanitize_input(request.form.get("payment_details")),
            "telegram_username": sanitize_input(request.form.get("telegram_username")),
            "email_addresses": sanitize_input(
                request.form.get("email_addresses", "[]")
            ),
        }

        # التحقق من البيانات المطلوبة
        if not all(
            [
                form_data["platform"],
                form_data["whatsapp_number"],
                form_data["payment_method"],
            ]
        ):
            return (
                jsonify({"success": False, "message": "Missing required fields"}),
                400,
            )

        # التحقق من الواتساب باستخدام وزارة التحقق
        whatsapp_validation = validate_whatsapp_ultimate(form_data["whatsapp_number"])
        if not whatsapp_validation.get("is_valid"):
            return (
                jsonify(
                    {
                        "success": False,
                        "message": f"رقم الواتساب غير صحيح: {whatsapp_validation.get('error', 'رقم غير صالح')}",
                    }
                ),
                400,
            )

        # التحقق من طريقة الدفع
        payment_method = form_data["payment_method"]
        payment_details = form_data["payment_details"]

        if payment_method in [
            "vodafone_cash",
            "etisalat_cash",
            "orange_cash",
            "we_cash",
            "bank_wallet",
        ]:
            if not validate_mobile_payment(payment_details):
                return (
                    jsonify(
                        {"success": False, "message": "Invalid mobile payment number"}
                    ),
                    400,
                )

        elif payment_method == "tilda":
            # 🔥 استخدام re المُستورد الآن
            clean_card = re.sub(r"[^\d]", "", payment_details)
            if not validate_card_number(clean_card):
                return (
                    jsonify({"success": False, "message": "Invalid card number"}),
                    400,
                )
            # 🔥 إضافة تحديث payment_details مع الرقم المُنظف
            form_data["payment_details"] = clean_card

        elif payment_method == "instapay":
            is_valid, extracted_link = validate_instapay_link(payment_details)
            if not is_valid:
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "لم يتم العثور على رابط InstaPay صحيح في النص المدخل",
                        }
                    ),
                    400,
                )
            form_data["payment_details"] = extracted_link

        # إنشاء الملف الشخصي باستخدام وزارة البيانات
        result = create_user_profile(form_data, client_ip, user_agent)

        if result["success"]:
            # إضافة معلومات الواتساب للاستجابة
            user_data = result["user_data"]
            user_data["whatsapp_info"] = {
                "country": whatsapp_validation.get("country"),
                "carrier": whatsapp_validation.get("carrier"),
                "whatsapp_status": whatsapp_validation.get("whatsapp_status"),
                "verification_method": whatsapp_validation.get("verification_method"),
                "confidence": whatsapp_validation.get("confidence"),
                "score": whatsapp_validation.get("score"),
            }

            # توليد token جديد للأمان
            session["csrf_token"] = generate_csrf_token()

            response_data = {
                "success": True,
                "message": "تم التحقق بالطرق المبتكرة وحفظ البيانات بنجاح!",
                "user_id": result["user_id"],
                "new_csrf_token": session["csrf_token"],
                "data": user_data,
            }

            return jsonify(response_data)
        else:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": result.get("message", "فشل في حفظ البيانات"),
                    }
                ),
                500,
            )

    except Exception as e:
        print(f"خطأ في تحديث الملف الشخصي: {str(e)}")
        print(f"تفاصيل الخطأ: {repr(e)}")  # 🔥 إضافة تفاصيل أكثر للخطأ
        return jsonify({"success": False, "message": "Internal server error"}), 500


@app.route("/generate-telegram-code", methods=["POST"])
def generate_telegram_code_endpoint():
    """API لتوليد كود التليجرام - محدثة مع الوزارة الجديدة"""
    try:
        data = request.get_json()

        platform = sanitize_input(data.get("platform", ""))
        whatsapp_number = sanitize_input(data.get("whatsapp_number", ""))

        if not platform or not whatsapp_number:
            return (
                jsonify({"success": False, "message": "يرجى إكمال الملف الشخصي أولاً"}),
                400,
            )

        # استخدام وزارة التليجرام
        result = create_telegram_code(
            platform,
            whatsapp_number,
            data.get("payment_method", ""),
            data.get("payment_details", ""),
            data.get("telegram_username", ""),
        )

        return jsonify(result)

    except Exception as e:
        print(f"خطأ في توليد كود التليجرام: {str(e)}")
        return jsonify({"success": False, "message": "خطأ في الخادم"})


@app.route("/telegram-webhook", methods=["POST"])
def telegram_webhook():
    """استقبال رسائل من التليجرام بوت - محدثة مع الوزارة الجديدة"""
    try:
        update = request.get_json()

        # استخدام وزارة التليجرام لمعالجة الـ webhook
        result = process_telegram_webhook(update)

        return jsonify({"ok": True, "result": result})

    except Exception as e:
        print(f"خطأ في معالجة telegram webhook: {str(e)}")
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/get-bot-username", methods=["GET"])
def get_bot_username():
    """الحصول على username البوت - محدثة مع الوزارة الجديدة"""
    try:
        bot_info = telegram_manager.get_bot_info()

        if bot_info:
            return jsonify(
                {
                    "success": True,
                    "username": bot_info.get("username", telegram_manager.bot_username),
                }
            )
        else:
            return jsonify({"success": True, "username": telegram_manager.bot_username})

    except Exception as e:
        print(f"خطأ في الحصول على username البوت: {str(e)}")
        return jsonify({"success": False, "username": telegram_manager.bot_username})


@app.route("/admin-data")
def admin_data():
    """عرض البيانات الإدارية - محدثة مع الوزارات الجديدة"""
    try:
        # جمع البيانات من جميع الوزارات
        telegram_data = telegram_manager.get_admin_data()
        profile_data = profile_handler.get_all_users()
        config_summary = app_config.get_config_summary()

        admin_data = {
            "config": config_summary,
            "telegram": {
                "codes_count": telegram_data["telegram_codes_count"],
                "bot_username": telegram_data["bot_username"],
            },
            "profiles": {"users_count": profile_data["users_count"]},
            "system_info": {
                "timestamp": datetime.now().isoformat(),
                "version": "2.0.0 - Modular Architecture",
            },
        }

        return jsonify(admin_data)

    except Exception as e:
        print(f"خطأ في البيانات الإدارية: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/check-telegram-status/<code>")
def check_telegram_status(code):
    """فحص حالة كود التليجرام - محدثة مع الوزارة الجديدة"""
    try:
        status = telegram_manager.check_telegram_status(code)
        return jsonify(status)

    except Exception as e:
        print(f"خطأ في فحص حالة التليجرام: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/set-telegram-webhook", methods=["POST"])
def set_telegram_webhook():
    """تعيين webhook للتليجرام - محدثة مع الوزارة الجديدة"""
    try:
        data = request.get_json()
        webhook_url = data.get("webhook_url")

        if not webhook_url:
            return jsonify({"success": False, "error": "webhook_url مطلوب"}), 400

        result = telegram_manager.set_webhook(webhook_url)
        return jsonify(result)

    except Exception as e:
        print(f"خطأ في تعيين webhook: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/setup-telegram", methods=["GET"])
def setup_telegram():
    """إعداد التليجرام تلقائياً - للاستخدام مرة واحدة"""
    try:
        # تعيين webhook
        result = telegram_manager.set_webhook()
        
        # اختبار البوت
        bot_info = telegram_manager.get_bot_info()
        
        setup_info = {
            'webhook_result': result,
            'bot_info': bot_info,
            'config': telegram_manager.get_admin_data(),
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(setup_info)
        
    except Exception as e:
        print(f"خطأ في إعداد التليجرام: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ============================================================================
# 🚦 الخطوة 6: تعريف معالجات الأخطاء
# ============================================================================


@app.errorhandler(404)
def not_found(error):
    """معالج خطأ 404"""
    return jsonify({"error": "الصفحة المطلوبة غير موجودة"}), 404


@app.errorhandler(500)
def internal_error(error):
    """معالج خطأ 500"""
    print(f"خطأ داخلي في الخادم: {str(error)}")
    return jsonify({"error": "خطأ داخلي في الخادم"}), 500

# ============================================================================
# 🏁 الخطوة 7: تشغيل التطبيق
# ============================================================================


if __name__ == "__main__":
    print("\n🚀 بدء تشغيل FC 26 Profile System")
    print("📦 البنية الجديدة:")
    print("   ✅ وزارة التحقق (validators.py)")
    print("   ✅ وزارة التليجرام (telegram_manager.py)")
    print("   ✅ وزارة البيانات (profile_handler.py)")
    print("   ✅ وزارة الإعدادات (app_config.py)")
    print("   ✅ التطبيق الرئيسي المُحسن (app.py)")

    app.run(
        host=app_config.config.get("HOST", "0.0.0.0"),
        port=app_config.config.get("PORT", 10000),
        debug=app_config.config.get("DEBUG", False),
    )
