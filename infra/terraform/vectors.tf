# Semantic search: S3 Vectors bucket + index and Lambda permissions.
# NOTE: like the rest of this root, documentation-only — these resources were
# CLI-applied 2026-07-27 (dev twin: memeon-vectors-dev + memeon-api-dev-lambda-role,
# same shape). The aws_s3vectors_* types may not exist in the provider yet;
# resources created via `aws s3vectors create-vector-bucket` / `create-index`.
#
#   bucket:  memeon-vectors-production
#   index:   memes (dimension 256, distanceMetric cosine, dataType float32)
#   lambda env: VECTOR_BUCKET=memeon-vectors-production
#
# Embeddings come from Bedrock amazon.titan-embed-text-v2:0 (256-dim, normalized).

resource "aws_iam_role_policy" "lambda_vector_search" {
  name = "memeon-vector-search"
  role = aws_iam_role.api_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["bedrock:InvokeModel"]
        Resource = "arn:aws:bedrock:us-west-2::foundation-model/amazon.titan-embed-text-v2:0"
      },
      {
        Effect = "Allow"
        Action = [
          "s3vectors:PutVectors",
          "s3vectors:QueryVectors",
          "s3vectors:DeleteVectors",
          "s3vectors:GetVectors",
          "s3vectors:GetIndex",
        ]
        Resource = "arn:aws:s3vectors:us-west-2:218827615080:bucket/memeon-vectors-production/index/memes"
      },
    ]
  })
}
