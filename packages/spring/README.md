# Medusa Ledger — Spring Boot starter (HTTP sidecar)

v0.1 uses HTTP against the Medusa Docker sidecar. Native Java hash (same as Node SPEC) is v1.1.

## Maven

```xml
<dependency>
  <groupId>com.medusa</groupId>
  <artifactId>medusa-ledger-client</artifactId>
  <version>0.1.0</version>
</dependency>
```

## Gradle

```gradle
implementation 'com.medusa:medusa-ledger-client:0.1.0'
```

## Usage

Start sidecar:

```bash
docker compose up --build
```

Append event (Java 11+ HttpClient):

```java
var body = """
  {"eventId":"order-001","eventType":"ORDER_CREATED",
   "payload":{"amount":50000,"currency":"COP"}}
  """;
var req = HttpRequest.newBuilder()
  .uri(URI.create("http://localhost:8080/api/events"))
  .header("Content-Type", "application/json")
  .POST(HttpRequest.BodyPublishers.ofString(body))
  .build();
var res = HttpClient.newHttpClient().send(req, HttpResponse.BodyHandlers.ofString());
System.out.println(res.body());
```

Verify:

```java
var verify = HttpClient.newHttpClient().send(
  HttpRequest.newBuilder().uri(URI.create("http://localhost:8080/api/verify")).GET().build(),
  HttpResponse.BodyHandlers.ofString());
System.out.println(verify.body());
```

See `SPEC.md` for protocol. Node is the reference hash implementation in v0.1.
