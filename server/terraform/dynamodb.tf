resource "aws_dynamodb_table" "dynamodb-statements" {
  name = "finances-statements"
  read_capacity = 5
  write_capacity = 5
  hash_key = "user"
  range_key = "statementId"

  attribute {
    name = "user"
    type = "S"
  }

  attribute {
    name = "uploadedOn"
    type = "N"
  }

  attribute {
    name = "statementId"
    type = "S"
  }

  local_secondary_index {
    name = "finances-logs-uploadedOn"
    range_key = "uploadedOn"
    projection_type = "INCLUDE"
    non_key_attributes = ["statementId", "status"]
  }
}

resource "aws_dynamodb_table" "dynamodb-transactions" {
  name = "finances-transactions"
  read_capacity = 5
  write_capacity = 5
  hash_key = "user"
  range_key = "txnid"

  attribute {
    name = "user"
    type = "S"
  }

  attribute {
    name = "txnid"
    type = "S"
  }
}
resource "aws_dynamodb_table" "dynamodb-day-aggregations" {
  name = "finances-day-aggregations"
  read_capacity = 5
  write_capacity = 5
  hash_key = "user"
  range_key = "dateAndStatement"

  attribute {
    name = "user"
    type = "S"
  }

  attribute {
    name = "dateAndStatement"
    type = "S"
  }
}
resource "aws_dynamodb_table" "dynamodb-logs" {
  name = "finances-logs"
  read_capacity = 5
  write_capacity = 5
  hash_key = "user"
  range_key = "timestamp"

  attribute {
    name = "user"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }
}
