import json
def lambda_handler(event, context):
    return {"statusCode":200,"headers":{"Content-Type":"application/json"},"body":json.dumps({"ok":True,"hint":"Run rag/build_index.py locally and upload to S3 under index/."})}
