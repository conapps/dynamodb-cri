import { DynamoDBStreamEvent } from 'aws-lambda';

export var NewImage = {
  pk: {
    S: 'cjlxtixgo000anu5pf0fvelg2'
  },
  sk: {
    S: 'TestTenant|testEntity'
  },
  gk: {
    S: 'TestName'
  },
  __v: {
    S: 'name'
  },
  document: {
    S: '123.456.7-9'
  },
  email: {
    S: 'test@mail.com'
  }
};

export var OldImage = {
  pk: {
    S: 'cjlxtixgo000anu5pf0fvelg2'
  },
  sk: {
    S: 'TestTenant|testEntity'
  },
  gk: {
    S: 'TestName'
  },
  __v: {
    S: 'name'
  },
  document: {
    S: '123.456.78-9'
  },
  email: {
    S: 'test@mail.com'
  }
};

export var Keys = {
  sk: {
    S: 'TestTenant|testEntity'
  },
  pk: {
    S: 'cjlxtixgo000anu5pf0fvelg2'
  }
};

export var insertStream: DynamoDBStreamEvent = {
  Records: [
    {
      eventID: '7d4d4a98ef66f19dw8bc9ae1028d697a',
      eventName: 'INSERT',
      eventVersion: '1.1',
      eventSource: 'aws:dynamodb',
      awsRegion: 'us-east-1',
      dynamodb: {
        ApproximateCreationDateTime: 1536696500,
        Keys,
        NewImage,
        SequenceNumber: '22800000000000317850930',
        SizeBytes: 242,
        StreamViewType: 'NEW_AND_OLD_IMAGES'
      },
      eventSourceARN:
        'arn:aws:dynamodb:us-east-1:61231159503:table/table/stream/2018-09-11T23:21:19.790'
    }
  ]
};

export var modifyStream: DynamoDBStreamEvent = {
  Records: [
    {
      eventID: '22a116dfa4aced1e9aabccb14797125a',
      eventName: 'MODIFY',
      eventVersion: '1.1',
      eventSource: 'aws:dynamodb',
      awsRegion: 'us-east-1',
      dynamodb: {
        ApproximateCreationDateTime: 1536677940,
        Keys,
        NewImage,
        OldImage,
        SequenceNumber: '28000000000000318996611',
        SizeBytes: 475,
        StreamViewType: 'NEW_AND_OLD_IMAGES'
      },
      eventSourceARN:
        'arn:aws:dynamodb:us-east-1:6123176353203:table/test/stream/2018-09-11T14:21:19.790'
    }
  ]
};

export var removeStream: DynamoDBStreamEvent = {
  Records: [
    {
      eventID: 'a3edad8bd1f29e431031662d8bb49b8d4',
      eventName: 'REMOVE',
      eventVersion: '1.1',
      eventSource: 'aws:dynamodb',
      awsRegion: 'us-east-1',
      dynamodb: {
        ApproximateCreationDateTime: 1536678720,
        Keys,
        OldImage,
        SequenceNumber: '31800000000000319548736',
        SizeBytes: 276,
        StreamViewType: 'NEW_AND_OLD_IMAGES'
      },
      eventSourceARN:
        'arn:aws:dynamodb:us-east-1:6123176353203:table/test/stream/2018-09-11T14:21:19.790'
    }
  ]
};
