# Lambda layer for node_modules
resource "aws_lambda_layer_version" "lambda_layer_nodemodules" {
  filename = "../build/layer/nodemodules.zip"
  layer_name = "finances-nodemodules"
  compatible_runtimes = ["nodejs8.10"]
  source_code_hash = "${filebase64sha256("../build/layer/nodemodules.zip")}"
}

# Lambda to parse statements
resource "aws_lambda_function" "lambda_parse_statement" {
  function_name = "finances-parse-statement"
  handler = "index.handler"
  filename = "../build/source/source.zip"
  source_code_hash = "${filebase64sha256("../build/source/source.zip")}"
  runtime = "nodejs8.10"
  role = "${aws_iam_role.aws_iam_role_lambda.arn}"
  layers = ["${aws_lambda_layer_version.lambda_layer_nodemodules.arn}"]
  timeout = 120
  reserved_concurrent_executions = 2
  publish = true
}

# S3 bucket notification
resource "aws_lambda_permission" "allow_bucket_trigger" {
  action = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.lambda_parse_statement.arn}"
  principal = "s3.amazonaws.com"
  source_arn = "arn:aws:s3:::jiewmeng-finances"
}

resource "aws_s3_bucket_notification" "s3_statement_uploaded" {
  bucket = "jiewmeng-finances"
  depends_on = ["aws_lambda_permission.allow_bucket_trigger"]
  lambda_function {
    id = "statement-uploaded"
    lambda_function_arn = "${aws_lambda_function.lambda_parse_statement.arn}"
    events = ["s3:ObjectCreated:*"]
    filter_prefix = "statements"
    filter_suffix = ".pdf"
  }
}
