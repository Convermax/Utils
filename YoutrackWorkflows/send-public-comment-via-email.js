/**
 * This is a template for an on-change rule. This rule defines what
 * happens when a change is applied to an issue.
 *
 * For details, read the Quick Start Guide:
 * https://www.jetbrains.com/help/youtrack/devportal/Quick-Start-Guide-Workflows-JS.html
 */


const entities = require('@jetbrains/youtrack-scripting-api/entities');
const workflow = require('@jetbrains/youtrack-scripting-api/workflow');

const {Helper} = require("./helper");


exports.rule = entities.Issue.onChange({
  // TODO: give the rule a human-readable title
  title: 'Send public comment via email',
  guard: (ctx) => {
    const issue = ctx.issue;
    if(issue.comments.isChanged){
      const newComment = issue.comments.added.get(0) ?? null;
      if (!newComment) return false;
      const isValidAutor = newComment.author.isInGroup("Convermax Team") && newComment.author.fullName !== "Reporter" && newComment.author.fullName !== "Convermax Team";

      //workflow.message(newComment?.permittedGroup.name === "Public");
      return newComment && newComment.permittedGroup && newComment.permittedGroup.name === "Public" && isValidAutor;
    }
    return false;
  },
  action: (ctx) => {
    const issue = ctx.issue;
    const helper = new Helper();
    const frontLink = issue.fields["Front Link"] ?? null;

    const issueLink = helper.getIssueLink(issue);

    const newComment = issue.comments.added.get(0);


    const taskDescription = issue.description;
    const issueSummary = issue.summary;

    const cleanText = helper.ConvertYoutrackToHtml(newComment.text);

    const emailPrepared = helper.Notification(cleanText, taskDescription, issueLink, issueSummary, newComment.author.fullName);

    if (frontLink){
      const frontConversationId = helper.GetConversationIdFromFrontlink(frontLink);
      if (frontConversationId){
        helper.SendEmailToConversation(emailPrepared, frontConversationId);
      }
    }
    else{
      const recipients = helper.getRecipientsFromCC(issue.fields["CC"]);
      if(recipients){
        helper.SendNewEmail(emailPrepared, recipients, issue, "New comment added");
      }
      else{
        workflow.message("CC is empty");
      }
    }

  },
  requirements: {
    // TODO: add requirements
  }
});
