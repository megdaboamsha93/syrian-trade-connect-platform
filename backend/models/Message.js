const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: [true, 'Conversation is required']
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required']
  },
  senderBusiness: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: [true, 'Sender business is required']
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [5000, 'Message cannot exceed 5000 characters']
  },
  messageType: {
    type: String,
    enum: ['text', 'inquiry', 'pricing_request', 'partnership_proposal', 'system', 'quote_response'],
    default: 'text'
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'document', 'link']
    },
    url: String,
    filename: String,
    originalName: String,
    size: Number,
    mimeType: String
  }],
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deletedAt: {
      type: Date,
      default: Date.now
    }
  }],
  editHistory: [{
    content: String,
    editedAt: {
      type: Date,
      default: Date.now
    }
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  metadata: {
    inquiryType: String,
    productId: String,
    quotationDetails: {
      quantity: Number,
      price: Number,
      currency: String,
      validUntil: Date
    }
  }
}, {
  timestamps: true
});

// Indexes
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ messageType: 1 });

// Transform output
messageSchema.methods.toJSON = function() {
  const messageObject = this.toObject();
  // Don't show deleted messages content
  if (this.isDeleted) {
    messageObject.content = '[Message deleted]';
    messageObject.attachments = [];
  }
  return messageObject;
};

module.exports = mongoose.model('Message', messageSchema); 