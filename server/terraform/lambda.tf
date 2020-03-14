# Lambda layer for node_modules
resource "aws_lambda_layer_version" "lambda_parsing_layer_nodemodules" {
  filename = "../build/parsing-layer/nodemodules.zip"
  layer_name = "finances-parsing-nodemodules"
  compatible_runtimes = ["nodejs8.10"]
  source_code_hash = "${filebase64sha256("../build/parsing-layer/nodemodules.zip")}"
}

# Lambda to parse statements
resource "aws_lambda_function" "lambda_parse_statement" {
  function_name = "finances-parse-statement"
  handler = "index.handler"
  filename = "../build/parsing/parsing.zip"
  source_code_hash = "${filebase64sha256("../build/parsing/parsing.zip")}"
  runtime = "nodejs8.10"
  role = "${aws_iam_role.aws_iam_role_lambda.arn}"
  layers = ["${aws_lambda_layer_version.lambda_parsing_layer_nodemodules.arn}"]
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

# Lambda layer for API node_modules
resource "aws_lambda_layer_version" "lambda_api_layer_nodemodules" {
  filename = "../build/api-layer/api-nodemodules.zip"
  layer_name = "finances-api-nodemodules"
  compatible_runtimes = ["nodejs8.10"]
  source_code_hash = "${filebase64sha256("../build/api-layer/api-nodemodules.zip")}"
}

# GET /statements
resource "aws_lambda_function" "api_statements_list" {
  function_name = "finances-api-statements-get"
  handler = "api/statements/list.handler"
  filename = "../build/api/api.zip"
  source_code_hash = "${filebase64sha256("../build/api/api.zip")}"
  layers = ["${aws_lambda_layer_version.lambda_api_layer_nodemodules.arn}"]
  runtime = "nodejs8.10"
  role = "${aws_iam_role.aws_iam_role_lambda.arn}"
  timeout = 20
  reserved_concurrent_executions = 5
  publish = true
  environment = {
    variables = {
      CORS_ORIGINS = "${var.cors_origins}"
    }
  }
}

# GET /statements/recent
resource "aws_lambda_function" "api_statements_recent" {
  function_name = "finances-api-statements-recent-get"
  handler = "api/statements/recent.handler"
  filename = "../build/api/api.zip"
  source_code_hash = "${filebase64sha256("../build/api/api.zip")}"
  layers = ["${aws_lambda_layer_version.lambda_api_layer_nodemodules.arn}"]
  runtime = "nodejs8.10"
  role = "${aws_iam_role.aws_iam_role_lambda.arn}"
  timeout = 20
  reserved_concurrent_executions = 5
  publish = true
  environment = {
    variables = {
      CORS_ORIGINS = "${var.cors_origins}"
    }
  }
}


# POST /statements
resource "aws_lambda_function" "api_statements_upload" {
  function_name = "finances-api-statements-post"
  handler = "api/statements/upload.handler"
  filename = "../build/api/api.zip"
  source_code_hash = "${filebase64sha256("../build/api/api.zip")}"
  layers = ["${aws_lambda_layer_version.lambda_api_layer_nodemodules.arn}"]
  runtime = "nodejs8.10"
  role = "${aws_iam_role.aws_iam_role_lambda.arn}"
  timeout = 20
  reserved_concurrent_executions = 5
  publish = true
  environment = {
    variables = {
      CORS_ORIGINS = "${var.cors_origins}"
      S3_BUCKET = "${var.s3_bucket}"
    }
  }
}

# GET /transactions
resource "aws_lambda_function" "api_transactions_list" {
  function_name = "finances-api-transactions-get"
  handler = "api/transactions/list.handler"
  filename = "../build/api/api.zip"
  source_code_hash = "${filebase64sha256("../build/api/api.zip")}"
  layers = ["${aws_lambda_layer_version.lambda_api_layer_nodemodules.arn}"]
  runtime = "nodejs8.10"
  role = "${aws_iam_role.aws_iam_role_lambda.arn}"
  timeout = 20
  reserved_concurrent_executions = 5
  publish = true
  environment = {
    variables = {
      CORS_ORIGINS = "${var.cors_origins}"
    }
  }
}

# GET /logs
resource "aws_lambda_function" "api_logs_list" {
  function_name = "finances-api-logs-get"
  handler = "api/logs/list.handler"
  filename = "../build/api/api.zip"
  source_code_hash = "${filebase64sha256("../build/api/api.zip")}"
  layers = ["${aws_lambda_layer_version.lambda_api_layer_nodemodules.arn}"]
  runtime = "nodejs8.10"
  role = "${aws_iam_role.aws_iam_role_lambda.arn}"
  timeout = 20
  reserved_concurrent_executions = 5
  publish = true
  environment = {
    variables = {
      CORS_ORIGINS = "${var.cors_origins}"
    }
  }
}

# GET /aggregations
resource "aws_lambda_function" "api_aggregations_by-day" {
  function_name = "finances-api-aggregations-by-day"
  handler = "api/aggregations/by-day.handler"
  filename = "../build/api/api.zip"
  source_code_hash = "${filebase64sha256("../build/api/api.zip")}"
  layers = ["${aws_lambda_layer_version.lambda_api_layer_nodemodules.arn}"]
  runtime = "nodejs8.10"
  role = "${aws_iam_role.aws_iam_role_lambda.arn}"
  timeout = 20
  reserved_concurrent_executions = 5
  publish = true
  environment = {
    variables = {
      CORS_ORIGINS = "${var.cors_origins}"
    }
  }
}


# API Gateway Authorizer
resource "aws_lambda_function" "authorizer" {
  function_name = "finances-api-authorizer"
  handler = "api/authorizer.handler"
  filename = "../build/api/api.zip"
  source_code_hash = "${filebase64sha256("../build/api/api.zip")}"
  layers = ["${aws_lambda_layer_version.lambda_api_layer_nodemodules.arn}"]
  runtime = "nodejs8.10"
  role = "${aws_iam_role.aws_iam_role_lambda.arn}"
  timeout = 20
  reserved_concurrent_executions = 5
  publish = true
  environment = {
    variables = {
      API_ID = "${aws_api_gateway_rest_api.api.id}"
    }
  }
}
