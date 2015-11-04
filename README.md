## firechat-deleter

If your [Firechat](https://github.com/firebase/firechat) installation is
popular enough, you’ll want to clear out old messages periodically to keep your
Firebase instance healthy.

This is a simple script to do that.

### Usage

```bash
firechat-deleter [--rate-limit MAX_DELETIONS_PER_SECOND] FIRECHAT_URL FIREBASE_SECRET CUTOFF_TIMESTAMP
```

* `FIRECHAT_URL` is the URL of your Firechat instance
* `FIREBASE_SECRET` is your secret key
* `CUTOFF_TIMESTAMP` is a seconds-since-unix-epoch timestamp. Messages older
  than this will be deleted.
* `MAX_DELETIONS_PER_SECOND` will ensure you don’t send too many deletion
  requests

### Disclaimer

This script probably won’t work if your Firebase instance is already really
big. It’s good for preventing problems, not fixing them.

### License

firechat-deleter is freely distributable under the MIT license. See attached LICENSE for all the sordid details.
