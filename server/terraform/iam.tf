data "aws_iam_policy_document" "iam_policy_doc_lambda" {
  version = "2012-10-17"
  statement {
    sid = "CloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:*"
    ]
    resources = ["arn:aws:logs:*:*:*"]
  }
  statement {
    sid = "S3"
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:GetObject"
    ]
    resources = [
      "arn:aws:s3:::jiewmeng-finances/statements/*"
    ]
  }
  statement {
    sid = "S3ListBucket"
    effect = "Allow"
    actions = [
      "s3:ListBucket"
    ]
    resources = [
      "arn:aws:s3:::jiewmeng-finances"
    ]
  }
  statement {
    sid = "DynamoDB"
    effect = "Allow"
    actions = [
      "dynamodb:BatchGetItem",
      "dynamodb:BatchWriteItem",
      "dynamodb:PutItem",
      "dynamodb:ListTables",
      "dynamodb:DeleteItem",
      "dynamodb:GetItem",
      "dynamodb:Query",
      "dynamodb:UpdateItem"
    ]
    resources = [
      "arn:aws:dynamodb:ap-southeast-1:${var.aws_account_id}:table/finances-*",
    ]
  }
}

data "aws_iam_policy_document" "iam_policy_doc_assume_role" {
  version = "2012-10-17"
  statement {
    effect = "Allow"
    actions = [
      "sts:AssumeRole"
    ]
    principals = {
      type = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_policy" "aws_iam_policy_lambda" {
  name = "finances-lambda"
  policy = "${data.aws_iam_policy_document.iam_policy_doc_lambda.json}"
}

resource "aws_iam_role" "aws_iam_role_lambda" {
  name = "finances-lambda"
  assume_role_policy = "${data.aws_iam_policy_document.iam_policy_doc_assume_role.json}"
}

resource "aws_iam_role_policy_attachment" "aws_iam_attach_lambda_policy" {
  role = "${aws_iam_role.aws_iam_role_lambda.name}"
  policy_arn = "${aws_iam_policy.aws_iam_policy_lambda.arn}"
}
