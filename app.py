from flask import Flask, request, Response
from whatsapp_bot import WhatsAppBot
from config import Config
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
bot = WhatsAppBot()

@app.route('/webhook', methods=['GET', 'POST'])
def webhook():
    """
    Handle incoming WhatsApp messages via Twilio webhook
    
    GET: Webhook verification from Twilio
    POST: Incoming message from WhatsApp
    """
    
    if request.method == 'GET':
        # Webhook verification
        return _verify_webhook(request)
    
    elif request.method == 'POST':
        # Process incoming message
        return _process_incoming_message(request)

def _verify_webhook(request):
    """Verify webhook from Twilio"""
    token = request.args.get('hub.verify_token', '')
    challenge = request.args.get('hub.challenge', '')
    
    # For Twilio WhatsApp, this is typically handled differently
    # This is more for Facebook Messenger compatibility
    logger.info("Webhook verification received")
    return Response("ok", status=200)

def _process_incoming_message(request):
    """Process incoming WhatsApp message"""
    try:
        # Extract message details from Twilio webhook
        from_number = request.form.get('From', '')
        message_body = request.form.get('Body', '')
        message_sid = request.form.get('MessageSid', '')
        
        logger.info(f"Received message from {from_number}: {message_body}")
        
        # Process message and generate response
        response_text = bot.handle_incoming_message(from_number, message_body)
        
        # Send response
        if response_text:
            success = bot.send_message(from_number, response_text)
            if success:
                logger.info(f"Response sent to {from_number}")
        
        # Return 200 OK to acknowledge receipt
        return Response("", status=200)
    
    except Exception as e:
        logger.error(f"Error processing message: {e}", exc_info=True)
        return Response("", status=500)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return {'status': 'ok'}, 200

@app.route('/', methods=['GET'])
def home():
    """Home endpoint"""
    return {
        'name': Config.BOT_NAME,
        'status': 'running',
        'version': '1.0.0'
    }, 200

if __name__ == '__main__':
    try:
        Config.validate_config()
        logger.info(f"Starting {Config.BOT_NAME}...")
        app.run(
            host='0.0.0.0',
            port=Config.PORT,
            debug=Config.DEBUG
        )
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        exit(1)
