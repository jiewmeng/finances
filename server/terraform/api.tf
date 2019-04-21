resource "aws_api_gateway_rest_api" "api" {
  name = "finances"
  description = "Finances API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}
