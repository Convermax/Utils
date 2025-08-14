const entities = require('@jetbrains/youtrack-scripting-api/entities');
const workflow = require('@jetbrains/youtrack-scripting-api/workflow');

const { Helper } = require('./helper');

exports.rule = entities.Issue.onChange({
  // TODO: give the rule a human-readable title
  title: 'Send public comment via email',
  guard: (ctx) => {
    const { issue } = ctx;
    const newComment = issue.comments.added.get(0) ?? null;

    if (issue.comments.isChanged && newComment) {
      const isValidAutor =
        newComment.author.isInGroup('Convermax Team') &&
        newComment.author.fullName !== 'Reporter' &&
        newComment.author.fullName !== 'Convermax Team';
      return newComment.permittedGroup && newComment.permittedGroup.name === 'Public' && isValidAutor;
    }
    return false;
  },
  action: (ctx) => {
    const { issue } = ctx;
    const frontLink = issue.fields['Front Link'] ?? null;

    const issueLink = Helper.getIssueLink(issue);

    const newComment = issue.comments.added.get(0);

    const taskDescription = issue.description;
    const issueSummary = issue.summary;

    const cleanText = Helper.convertYoutrackToHtml(newComment.text);

    const emailPrepared = Helper.notification(
      cleanText,
      taskDescription,
      issueLink,
      issueSummary,
      newComment.author.fullName,
    );

    if (frontLink) {
      const frontConversationId = Helper.getConversationIdFromFrontlink(frontLink);
      if (frontConversationId) {
        Helper.sendEmailToConversation(emailPrepared, frontConversationId);
      }
    } else {
      const recipients = Helper.getRecipientsFromCC(issue.fields.CC);
      if (recipients) {
        Helper.sendNewEmail(emailPrepared, recipients, issue, 'New comment added');
      } else {
        workflow.message('CC is empty');
      }
    }
  },
  requirements: {},
});
