provider "aws" {
  region = "ap-southeast-1"
}

terraform {
  backend "s3" {}
}

data "terraform_remote_state" "s3_state" {
  backend = "s3"
  config {
    bucket = "${var.state_bucket}"
    key = "${var.state_key}"
    region = "ap-southeast-1"
  }
}

