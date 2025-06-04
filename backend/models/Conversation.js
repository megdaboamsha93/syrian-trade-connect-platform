const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastReadAt: {
      type: Date,
      default: Date.now
    },
    isArchived: {
      type: Boolean,
      default: false
    }
  }],
  subject: {
    type: String,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  messageCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'blocked'],
    default: 'active'
  },
  isGroupConversation: {
    type: Boolean,
    default: false
  },
  metadata: {
    inquiryType: {
      type: String,
      enum: ['product_inquiry', 'pricing_request', 'partnership', 'general', 'support']
    },
    relatedProduct: {
      type: mongoose.Schema.Types.ObjectId
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal'
    },
    tags: [String]
  }
}, {
  timestamps: true
});

// Indexes
conversationSchema.index({ 'participants.user': 1, lastActivity: -1 });
conversationSchema.index({ 'participants.business': 1, lastActivity: -1 });
conversationSchema.index({ lastActivity: -1 });
conversationSchema.index({ status: 1 });

// Methods
conversationSchema.methods.updateLastActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

conversationSchema.methods.addParticipant = async function(userId, businessId) {
  if (!this.participants.some(p => p.user.toString() === userId.toString() && p.business.toString() === businessId.toString())) {
    this.participants.push({
      user: userId,
      business: businessId,
      joinedAt: new Date(),
      lastReadAt: new Date()
    });
    await this.save();
  }
  return this;
};

conversationSchema.methods.removeParticipant = async function(userId, businessId) {
  this.participants = this.participants.filter(
    p => !(p.user.toString() === userId.toString() && p.business.toString() === businessId.toString())
  );
  await this.save();
  return this;
};

conversationSchema.methods.markAsRead = async function(userId) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString());
  if (participant) {
    participant.lastReadAt = new Date();
    await this.save();
  }
  return this;
};

conversationSchema.methods.archive = async function(userId) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString());
  if (participant) {
    participant.isArchived = true;
    await this.save();
  }
  return this;
};

conversationSchema.methods.unarchive = async function(userId) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString());
  if (participant) {
    participant.isArchived = false;
    await this.save();
  }
  return this;
};

// Virtual for unread count
conversationSchema.virtual('unreadCount').get(function() {
  return this.messageCount - this.participants.reduce((count, p) => {
    const lastReadMessage = p.lastReadAt;
    return count + (lastReadMessage ? 1 : 0);
  }, 0);
});

// Transform output
conversationSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Conversation', conversationSchema); 